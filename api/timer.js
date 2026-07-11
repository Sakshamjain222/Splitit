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

    // Handle GET Request (Fetch Timer for frontend index.html)
    if (req.method === 'GET') {
        if (!useGist && !JSONBIN_ID) {
            return res.status(200).json({ status: 'off', time: '' });
        }
        
        try {
            if (useGist) {
                // Read from GitHub Gist
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
                const fileContent = data.files && data.files['timer.json'] ? data.files['timer.json'].content : '{"status":"off","time":""}';
                return res.status(200).json(JSON.parse(fileContent));
            } else {
                // Read from JSONBin.io
                const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
                    headers: { 
                        'X-Master-Key': JSONBIN_KEY
                    }
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`JSONBin Fetch Error (${response.status}): ${errText}`);
                }
                
                const data = await response.json();
                return res.status(200).json(data.record);
            }
        } catch (error) {
            console.error("Timer Fetch Error:", error.message || error);
            return res.status(200).json({ status: 'off', time: '' });
        }
    }

    // Handle POST Request (Update Timer from admin.html)
    if (req.method === 'POST') {
        const providedPassword = req.headers['authorization'];
        
        // Security: Prevent unauthorized access (Defends against unauthorized writes)
        if (providedPassword !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: "Unauthorized. Wrong password." });
        }

        const { status, time } = req.body;
        
        // Security: Input Validation (Defends against Injection/XSS)
        if (!['active', 'off'].includes(status)) {
            return res.status(400).json({ error: "Invalid status format." });
        }
        
        if (!useGist && (!JSONBIN_ID || !JSONBIN_KEY)) {
            return res.status(500).json({ 
                error: "Storage not configured. Add GITHUB_GIST_ID & GITHUB_TOKEN (or JSONBIN_ID & JSONBIN_KEY) to Vercel environment variables." 
            });
        }

        try {
            if (useGist) {
                // Update GitHub Gist
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
                                content: JSON.stringify({ status, time })
                            }
                        }
                    })
                });
                
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`GitHub Gist Update Error (${response.status}): ${errText}`);
                }
                return res.status(200).json({ success: true, message: "Timer updated securely on GitHub Gist" });
            } else {
                // Update JSONBin.io
                const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_KEY
                    },
                    body: JSON.stringify({ status, time })
                });
                
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`JSONBin Update Error (${response.status}): ${errText}`);
                }
                
                return res.status(200).json({ success: true, message: "Timer updated securely on JSONBin" });
            }
        } catch (error) {
            console.error("Timer Update Error:", error.message || error);
            return res.status(500).json({ error: error.message || "Failed to save timer" });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
