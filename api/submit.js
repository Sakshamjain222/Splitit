export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // HIDING THE URL HERE ON THE SECURE SERVER
        const SHEET_URL = "https://script.google.com/macros/s/AKfycbz4Y-BWE_3ZoOMGs8kyQzxb3tR3SnhemTcUHYNN7gVT8SyKqvEI15R_e7IOOqLyhVa9/exec";

        // Vercel parses the application/json body automatically
        const orderData = req.body;

        // Replicate what the frontend originally did to connect to Apps Script
        const formData = new URLSearchParams();
        formData.append("data", JSON.stringify(orderData));

        const response = await fetch(SHEET_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString()
        });

        const resultText = await response.text();

        return res.status(200).json({ success: true, message: "Order processed successfully", sheet_response: resultText });
    } catch (error) {
        console.error("Error submitting order:", error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
