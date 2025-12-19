// Lightweight Google Translate helper using the public translate endpoint.
// NOTE: This is best-effort translation and should not be used for
// legally binding or highly critical medical wording without review.

export async function translateText(
  text: string,
  targetLanguage: 'en' | 'hi' | 'te'
): Promise<string> {
  if (!text || targetLanguage === 'en') {
    return text;
  }

  const apiUrl = 'https://translate.googleapis.com/translate_a/single';
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetLanguage,
    dt: 't',
    q: text,
  });

  try {
    const response = await fetch(`${apiUrl}?${params.toString()}`);
    const data = await response.json();

    let translated = '';
    if (Array.isArray(data) && Array.isArray(data[0])) {
      data[0].forEach((chunk: any) => {
        if (chunk && chunk[0]) {
          translated += chunk[0];
        }
      });
    }

    return translated || text;
  } catch (error) {
    // On any error, just fall back to original text
    console.error('translateText error', error);
    return text;
  }
}


