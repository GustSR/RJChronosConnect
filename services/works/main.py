import pika, json, time, os, redis

def connect_to_rabbitmq():
    """Tenta se conectar ao RabbitMQ com retentativas."""
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'rabbitmq')
    rabbitmq_user = os.getenv('RABBITMQ_DEFAULT_USER', 'user')
    rabbitmq_pass = os.getenv('RABBITMQ_DEFAULT_PASS', 'password')
    credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_pass)
    
    while True:
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=rabbitmq_host, credentials=credentials)
            )
            print("Conectado ao RabbitMQ com sucesso!")
            return connection
        except Exception as e:
            print(f"Erro inesperado ao conectar ao RabbitMQ: {e}. Tentando novamente em 5 segundos...")
            time.sleep(5)

def connect_to_redis():
    """Tenta se conectar ao Redis com retentativas."""
    redis_host = os.getenv('REDIS_HOST', 'redis')
    redis_password = os.getenv('REDIS_PASSWORD', 'password')
    
    while True:
        try:
            r = redis.Redis(
                host=redis_host,
                port=6379,
                db=0,
                password=redis_password,
                decode_responses=True
            )
            r.ping()
            print("Conectado ao Redis com sucesso!")
            return r
        except redis.exceptions.ConnectionError as e:
            print(f"Erro ao conectar ao Redis: {e}. Tentando novamente em 5 segundos...")
            time.sleep(5)


def main():
    """Função principal que roda o consumidor."""
    connection = connect_to_rabbitmq()
    redis_client = connect_to_redis()
    
    channel = connection.channel()

    # Garante que a fila existe e é durável
    channel.queue_declare(queue='task_queue', durable=True)
    print(' [*] Aguardando por mensagens. Para sair, pressione CTRL+C')

    def callback(ch, method, properties, body):
        try:
            task = json.loads(body)
            print(f" [x] Recebido: {task}")
            
            # Simula algum processamento com base na tarefa
            time.sleep(2) 
            
            # Cria um resultado
            result = {
                'task_id': task.get('task_id', 'N/A'),
                'device_id': task.get('device_id', 'N/A'),
                'status': 'completed',
                'result_data': f"Processamento para {task.get('device_id')} concluído."
            }
            print(f" [x] Processamento concluído. Resultado: {result}")

            # Salva o resultado no Redis
            redis_client.lpush('task_results', json.dumps(result))
            redis_client.ltrim('task_results', 0, 999)
            print(" [x] Resultado salvo no Redis.")

            # Confirma que a mensagem foi processada
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except json.JSONDecodeError:
            print(" [!] Erro ao decodificar a mensagem JSON. Rejeitando.")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        except Exception as e:
            print(f" [!] Ocorreu um erro inesperado: {e}. Rejeitando a mensagem.")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


    # Garante que o worker só pegue uma nova mensagem depois de finalizar a atual
    channel.basic_qos(prefetch_count=1)
    
    # Define a função de callback para a fila
    channel.basic_consume(queue='task_queue', on_message_callback=callback)

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("Consumidor interrompido.")
        connection.close()
    except Exception as e:
        print(f"Erro crítico no consumidor: {e}")
        if connection.is_open:
            connection.close()

if __name__ == '__main__':
    main()
