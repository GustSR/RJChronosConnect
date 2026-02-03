from netmiko.huawei import HuaweiTelnet
import inspect

print(f"HuaweiTelnet Class: {HuaweiTelnet}")
print(f"MRO: {[c.__name__ for c in HuaweiTelnet.mro()]}")

try:
    from netmiko import ConnectHandler
    print("ConnectHandler imported")
except ImportError as e:
    print(f"ImportError: {e}")

# Tenta instanciar (sem conectar) para ver defaults se possível
# Mas a conexão é feita no init, então vamos apenas checar a classe por enquanto.
