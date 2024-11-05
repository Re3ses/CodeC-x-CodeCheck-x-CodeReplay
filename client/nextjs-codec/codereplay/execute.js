// pages/api/execute.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).end();
    }
  
    const { code, language } = req.body;
    
    try {
      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': process.env.RAPID_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: code,
          language_id: language, // Map your language to Judge0 language IDs
          stdin: ''
        })
      });
  
      const { token } = await response.json();
  
      // Get execution result
      const result = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPID_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      }).then(res => res.json());
  
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error executing code' });
    }
  }