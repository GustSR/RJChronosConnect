#!/usr/bin/env python3
"""
Script para atualizar nomes de classes nos arquivos CLI renomeados.
"""

import os
import re

# Mapeamento de nomes antigos para novos
class_mappings = {
    'DisplayMacAddressCommand': 'GetMacAddressCliCommand',
    'DisplayOntAutofindCommand': 'GetOntAutofindCliCommand', 
    'DisplayOntFailedCommand': 'GetOntFailedCliCommand',
    'DisplayOntPortAttributeCommand': 'GetOntPortAttributeCliCommand',
    'DisplayOntRegisterInfoCommand': 'GetOntRegisterInfoCliCommand',
    'DisplayOntTrafficCommand': 'GetOntTrafficCliCommand',
    'DisplayPortStateCommand': 'GetPortStateCliCommand',
    'DisplayServicePortCommand': 'GetServicePortCliCommand',
    'DisplayStatisticsOntEthCommand': 'GetOntEthStatsCliCommand'
}

def update_file(filepath):
    """Atualiza nomes de classes em um arquivo."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Atualiza cada mapeamento
    for old_name, new_name in class_mappings.items():
        # Atualiza definição da classe
        content = re.sub(
            f'class {old_name}\\(',
            f'class {new_name}(',
            content
        )
    
    # Se houve mudanças, salva o arquivo
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Atualizado: {filepath}")
        return True
    
    return False

def main():
    """Executa a atualização em todos os arquivos CLI."""
    commands_dir = 'src/commands'
    
    # Lista arquivos CLI
    cli_files = [f for f in os.listdir(commands_dir) if f.endswith('_cli.py')]
    
    updated_count = 0
    for filename in cli_files:
        filepath = os.path.join(commands_dir, filename)
        if update_file(filepath):
            updated_count += 1
    
    print(f"\\nResumo: {updated_count} arquivos atualizados de {len(cli_files)} arquivos CLI")

if __name__ == '__main__':
    main()