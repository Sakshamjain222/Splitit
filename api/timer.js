module.exports = async function handler(req, res) {
    // Vercel Serverless Function to manage Timer State via JSONBin.io
    
    // Secure Environment Variables (Set these in your Vercel Dashboard)
    const JSONBIN_ID = process.env.JSONBIN_ID || '';
    const JSONBIN_KEY = process.env.JSONBIN_KEY || '';
    // The password to login to the admin page
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234'; 

    // Handle GET Request (Fetch Timer for frontend index.html)
    if (req.method === 'GET') {
        if (!JSONBIN_ID) {
            // Return default state if database is not configured yet
            return res.status(200).json({ status: 'off', time: '' });
        }
        
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
                headers: { 'X-Master-Key': JSONBIN_KEY }
            });
            if (!response.ok) throw new Error("Failed to fetch timer");
            
            const data = await response.json();
            // JSONBin returns the actual data inside a "record" object
            return res.status(200).json(data.record);
        } catch (error) {
            console.error("Timer Fetch Error:", error);
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
        
        if (!JSONBIN_ID || !JSONBIN_KEY) {
            return res.status(500).json({ 
                error: "Database not configured. Add JSONBIN_ID and JSONBIN_KEY to Vercel environment variables." 
            });
        }

        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_KEY
                },
                body: JSON.stringify({ status, time })
            });
            
            if (!response.ok) throw new Error("Failed to update database");
            
            return res.status(200).json({ success: true, message: "Timer updated securely" });
        } catch (error) {
            console.error("Timer Update Error:", error);
            return res.status(500).json({ error: "Failed to save timer" });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
