module.exports = async function handler(req, res) {
    // Vercel Serverless Function to manage Timer State via GitHub Gist or JSONBin.io
    
    // Secure Environment Variables (Set these in your Vercel Dashboard)
    const JSONBIN_ID = process.env.JSONBIN_ID || '';
    const JSONBIN_KEY = process.env.JSONBIN_KEY || ''; // Works with X-Master-Key or X-Access-Key
    
    // GitHub Gist Environment Variables (Method 2)
    const GITHUB_GIST_ID = process.env.GITHUB_GIST_ID || '';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
    
    // The password to login to the admin page
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234'; 

    // Determine storage engine: Use GitHub Gist if configured, otherwise fallback to JSONBin
    const useGist = Boolean(GITHUB_GIST_ID && GITHUB_TOKEN);

    // Helper function to read current data from storage
    async function getStorageData() {
        if (!useGist && !JSONBIN_ID) {
            return { status: 'off', time: '', studentProgress: {} };
        }
        try {
            if (useGist) {
                const response = await fetch(`https://api.github.com/gists/${GITHUB_GIST_ID}`, {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github+json'
                    }
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`GitHub Gist Fetch Error (${response.status}): ${errText}`);
                }
                const data = await response.json();
                const fileContent = data.files && data.files['timer.json'] ? data.files['timer.json'].content : '{"status":"off","time":"","studentProgress":{}}';
                const parsed = JSON.parse(fileContent);
                return { status: parsed.status || 'off', time: parsed.time || '', studentProgress: parsed.studentProgress || {} };
            } else {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
                    headers: { 'X-Master-Key': JSONBIN_KEY }
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`JSONBin Fetch Error (${response.status}): ${errText}`);
                }
                const data = await response.json();
                const parsed = data.record || {};
                return { status: parsed.status || 'off', time: parsed.time || '', studentProgress: parsed.studentProgress || {} };
            }
        } catch (error) {
            console.error("Storage Fetch Error:", error.message || error);
            return { status: 'off', time: '', studentProgress: {} };
        }
    }

    // Handle GET Request (Fetch Timer & Student Progress for frontend)
    if (req.method === 'GET') {
        const data = await getStorageData();
        return res.status(200).json(data);
    }

    // Handle POST Request (Update Timer or Student Progress from admin.html)
    if (req.method === 'POST') {
        const providedPassword = req.headers['authorization'];
        
        // Security: Prevent unauthorized access
        if (providedPassword !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: "Unauthorized. Wrong password." });
        }

        if (!useGist && (!JSONBIN_ID || !JSONBIN_KEY)) {
            return res.status(500).json({ 
                error: "Storage not configured. Add GITHUB_GIST_ID & GITHUB_TOKEN (or JSONBIN_ID & JSONBIN_KEY) to Vercel environment variables." 
            });
        }

        const currentData = await getStorageData();
        const payload = {
            status: req.body.status !== undefined ? req.body.status : currentData.status,
            time: req.body.time !== undefined ? req.body.time : currentData.time,
            studentProgress: req.body.studentProgress !== undefined ? req.body.studentProgress : currentData.studentProgress
        };

        try {
            if (useGist) {
                const response = await fetch(`https://api.github.com/gists/${GITHUB_GIST_ID}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        files: {
                            "timer.json": {
                                content: JSON.stringify(payload)
                            }
                        }
                    })
                });
                
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`GitHub Gist Update Error (${response.status}): ${errText}`);
                }
                return res.status(200).json({ success: true, message: "Storage updated securely on GitHub Gist", data: payload });
            } else {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_KEY
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`JSONBin Update Error (${response.status}): ${errText}`);
                }
                
                return res.status(200).json({ success: true, message: "Storage updated securely on JSONBin", data: payload });
            }
        } catch (error) {
            console.error("Storage Update Error:", error.message || error);
            return res.status(500).json({ error: error.message || "Failed to save data" });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
