import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'; // Proxy or Direct

export const analyzeChart = async (file, customPrompt = null) => {
    try {
        // Convert file to base64
        const base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/png;base64,
            reader.onerror = error => reject(error);
        });

        const token = await auth.currentUser?.getIdToken();

        const body = {
            imageData: base64Image,
            mimeType: file.type,
            feedback: ''
        };

        if (customPrompt) {
            body.customPrompt = customPrompt;
        }

        const response = await fetch(`${API_URL}/api/analyze-chart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || `Server Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};
