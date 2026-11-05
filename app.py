import os
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import FunctionTool, ToolSet

# ---------------------------------------------------------------------------
# 1. DEFINICIÓN DE LAS HERRAMIENTAS (Tools)
# ---------------------------------------------------------------------------

def inventory_tool(sku: str) -> str:
    """
    Consulta el stock disponible y la ubicación de un SKU en el almacén de Rio Claro.
    """
    # Aquí conectarías con tu base de datos o ERP
    return f"El SKU {sku} tiene 150 unidades disponibles en el Pasillo 4, Estante B."

def dashboard_tool(metric: str) -> str:
    """
    Genera u obtiene métricas clave del rendimiento del almacén (ej. 'ocupacion', 'despachos').
    """
    if metric == "ocupacion":
        return "El almacén de Rio Claro se encuentra al 82% de su capacidad."
    return f"Métrica '{metric}' procesada correctamente."

def replenishment_tool(sku: str, quantity: int) -> str:
    """
    Crea una orden de reabastecimiento automática para un SKU específico.
    """
    return f"Orden de reabastecimiento exitosa: Se solicitaron {quantity} unidades para el SKU {sku}."


# ---------------------------------------------------------------------------
# 2. CONFIGURACIÓN Y ORQUESTACIÓN DEL AGENTE
# ---------------------------------------------------------------------------

def main():
    # Cadena de conexión de tu proyecto en Azure AI Foundry
    # Se recomienda guardarla en una variable de entorno: AZURE_AIPROJECT_CONNECTION_STRING
    project_connection_string = os.getenv(
        "AZURE_AIPROJECT_CONNECTION_STRING", 
        "tu_connection_string_aqui"
    )

    # Inicializar el cliente del proyecto usando credenciales de Azure
    project_client = AIProjectClient.from_connection_string(
        credential=DefaultAzureCredential(),
        conn_str=project_connection_string
    )

    # Enpaquetar las funciones de Python como herramientas del SDK
    inventory_func = FunctionTool(inventory_tool)
    dashboard_func = FunctionTool(dashboard_tool)
    replenishment_func = FunctionTool(replenishment_tool)

    # Crear el conjunto de herramientas (ToolSet)
    toolset = ToolSet()
    toolset.add(inventory_func)
    toolset.add(dashboard_func)
    toolset.add(replenishment_func)

    # Crear el agente único orquestador (RioClaroWarehouseAgent)
    print("Creando RioClaroWarehouseAgent...")
    agent = project_client.agents.create_agent(
        model="gpt-4o",  # El modelo de despliegue que tengas en tu Foundry
        name="RioClaroWarehouseAgent",
        instructions=(
            "Eres el agente inteligente del almacén Rio Claro. Tu objetivo es ayudar a los usuarios "
            "a gestionar el inventario, ver estados del dashboard y generar órdenes de reabastecimiento. "
            "Utiliza las herramientas provistas cuando sea necesario para dar respuestas exactas."
        ),
        toolset=toolset
    )

    # ---------------------------------------------------------------------------
    # 3. PRUEBA DEL MVP (Crear un hilo de conversación)
    # ---------------------------------------------------------------------------
    thread = project_client.agents.create_thread()
    
    # Simulación de petición del usuario que activará herramientas
    user_message = "Hola, revisa el stock del SKU-990. Si hay menos de 200 unidades, pide 50 más."
    
    project_client.agents.create_message(
        thread_id=thread.id,
        role="user",
        content=user_message
    )

    print(f"Usuario: {user_message}")
    print("Agente procesando y orquestando herramientas...")
    
    # Ejecutar el agente
    run = project_client.agents.create_run(thread_id=thread.id, agent_id=agent.id)
    
    # Esperar el resultado (puedes usar un loop de chequeo en producción)
    while not run.status in ["completed", "failed"]:
        run = project_client.agents.get_run(thread_id=thread.id, run_id=run.id)

    # Recuperar y mostrar la respuesta final
    messages = project_client.agents.list_messages(thread_id=thread.id)
    last_message = messages.get_last_text_message_by_role("assistant")
    
    if last_message:
        print(f"RioClaroWarehouseAgent: {last_message.text.value}")

    # Limpieza del agente en Azure (Opcional para MVP)
    project_client.agents.delete_agent(agent.id)

if __name__ == "__main__":
    main()