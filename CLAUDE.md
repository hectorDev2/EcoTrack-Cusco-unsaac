@AGENTS.md
# Cómo ahorrar tokens en Claude Desktop

Guía rápida de buenas prácticas para reducir el consumo de tokens (y por tanto el uso/costo) cuando trabajás con Claude Desktop, especialmente si usás servidores MCP (conectores).

## 1. Por qué se gastan tantos tokens

- Cada mensaje que enviás reprocesa **todo** el historial de la conversación, no solo lo nuevo.
- Los servidores MCP conectados inyectan sus definiciones de herramientas (nombres, descripciones, parámetros) en cada turno, aunque no los uses.
- El resultado de una herramienta (un archivo leído, una respuesta JSON, un log) queda completo en el contexto para siempre dentro de esa sesión.
- Conversaciones largas con muchas idas y vueltas acumulan todo eso turno tras turno.

## 2. Acciones rápidas (las que más impacto tienen)

1. **Desconectá/desactivá los MCP que no estés usando.**
   En Configuración → Conectores (Connectors), apagá los que no necesites para la tarea actual. Cada conector activo suma tokens de "peaje" en cada mensaje, lo uses o no.

2. **Empezá chats nuevos para tareas nuevas.**
   No sigas una conversación gigante de un tema viejo para preguntar algo sin relación. Un chat nuevo arranca con contexto limpio.

3. **No pegues archivos completos si solo necesitás una parte.**
   Pegá únicamente el fragmento relevante (la función, la sección, las filas que importan) en vez de el documento entero.

4. **Pedí respuestas concisas cuando no necesitás un informe largo.**
   Frases como "respondeme en pocas líneas" o "solo el código, sin explicación" reducen los tokens de salida.

5. **Sé específico en el pedido.**
   Un prompt vago genera respuestas más largas porque Claude tiene que cubrir más posibilidades. Cuanto más preciso el pedido, más corta y directa la respuesta.

## 3. Si usás varios conectores/MCP

- Auditá qué conectores tenés activos y preguntate cuáles usás realmente cada semana.
- Si solo necesitás un conector para una tarea puntual, activalo, usalo y después desactivalo.
- Conectores con muchas herramientas (decenas de funciones) consumen más tokens "fijos" por turno que uno simple. Si tenés alternativa más liviana, preferila.

## 4. Buenas prácticas generales

| Hábito | Por qué ayuda |
|---|---|
| Cerrar y empezar un chat nuevo al cambiar de tema | Evita cargar historial irrelevante |
| Resumir antes de seguir una conversación muy larga | Reduce lo que se reprocesa en cada turno |
| Evitar pegar JSON/logs completos | El resultado de una herramienta queda fijo en el contexto |
| Pedir longitud de respuesta acotada | Bajan los tokens de salida |
| Revisar conectores activos periódicamente | Cada uno suma tokens fijos por mensaje |

## 5. Qué NO ayuda tanto

- Borrar mensajes anteriores del chat visible no reduce tokens si seguís en la misma conversación (el historial sigue contando).
- Usar abreviaciones extremas en tus mensajes apenas hace diferencia: el grueso del gasto suele venir del contexto acumulado y las herramientas, no de tu redacción.

## 6. Para más detalle

Esta guía está pensada para uso general. Si necesitás datos específicos de límites, planes o facturación de Claude Desktop, lo mejor es revisar el centro de ayuda oficial:
- https://support.claude.com

---
*Notas: las prácticas de este documento se basan en cómo funciona el contexto en modelos tipo Claude (se reenvía todo el historial y las definiciones de herramientas en cada turno). Los detalles exactos de la interfaz pueden cambiar; verificá en support.claude.com si algo no coincide con lo que ves en tu app.*