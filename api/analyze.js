// api/analyze.js — Serverless function para Vercel
// La API key vive aquí (servidor), nunca en el navegador

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — solo permitir tu dominio de Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { caseText } = req.body;

  if (!caseText || caseText.trim().length < 80) {
    return res.status(400).json({ error: 'Texto del caso demasiado corto.' });
  }

  const SYSTEM = `Sos supervisor/a clinico/a con formacion en TCC y Neuropsicologia. Trabajas para SEMAS Clinica.
Tu tarea: ayudar al profesional a prepararse para supervision grupal. NO diagnosticas ni cerras tratamientos.

Responde con exactamente este formato:

[S1]
contenido seccion 1
[S2]
contenido seccion 2
[S3]
contenido seccion 3
[S4]
contenido seccion 4
[S5]
contenido seccion 5
[END]

[S1] Lo que esta claro: informacion clinica bien descripta. Vinetas con guion (-). Frases como "Esta claro que...", "Se puede identificar...". Especifico con el caso presentado.

[S2] Lo que falta explorar: huecos clinicos concretos. Vinetas con guion (-). Frases como "No se menciona...", "Seria importante conocer...".

[S3] Posibles ejes de formulacion: 3 a 4 hipotesis provisionales (NO diagnosticos). Conecta historia, mantenimiento y creencias. Lenguaje tentativo: "Podria pensarse que...", "Una hipotesis posible es...". Integra perspectiva TCC y neurocientifica.

[S4] Preguntas para la supervision: 4 a 6 preguntas numeradas (1. 2. etc), concretas, que abran debate genuino en el grupo.

[S5] Sesgos y puntos ciegos: 2 a 4 puntos con guion (-). "Hay que cuidar no...", "Un riesgo frecuente en casos asi es...". Respetuoso pero directo.

Tono: clinico, calido, formativo. Espanol rioplatense. Sin JSON. Solo el texto con los delimitadores [S1] a [S5] y [END].`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Caso clinico:\n\n${caseText}` }]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errData.error?.message || 'Error al llamar a la API de Anthropic.'
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return res.status(200).json({ result: text });

  } catch (err) {
    console.error('Error en /api/analyze:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
