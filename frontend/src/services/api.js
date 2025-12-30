import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const analyzeScenario = async (text, context = '') => {
    try {
        const response = await axios.post(`${API_URL}/scenarios/`, {
            input_text: text,
            history_context: context
        });
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

export const synthesizePath = async (pathContent) => {
    try {
        const response = await axios.post(`${API_URL}/scenarios/synthesize/`, {
            path_content: pathContent
        });
        return response.data;
    } catch (error) {
        console.error("Synthesis API Error:", error);
        throw error;
    }
};

export const critiqueScenario = async (text) => {
    try {
        const response = await axios.post(`${API_URL}/scenarios/critique/`, {
            input_text: text
        });
        return response.data;
    } catch (error) {
        console.error("Critique API Error:", error);
        throw error;
    }
};

export const deleteAccount = async () => {
    try {
        const response = await axios.delete(`${API_URL}/auth/delete/`);
        return response.data;
    } catch (error) {
        console.error("Delete Account API Error:", error);
        throw error;
    }
};
