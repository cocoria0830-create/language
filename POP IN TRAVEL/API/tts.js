export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { text, lang } = req.query;
  if (!text || !lang) return res.status(400).json({ error: 'text and lang required' });

  try {
    // 구글 번역 TTS (서버 사이드에서 호출 → CORS 없음)
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=gtx&ttsspeed=0.8`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TTS proxy)',
        'Referer': 'https://translate.google.com/',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'TTS fetch failed: ' + response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
