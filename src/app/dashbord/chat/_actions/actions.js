'use server';

export async function sendNewMessage(prevState, formData) {
    const message = formData.get('message');
    const userId = formData.get('userId');

    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

    const timeStamp = new Date().valueOf(); // Get current timestam

    console.log("Sending message:", message, "to user:", userId, "at", timeStamp);

    return {
        success: true,
        message: "Message sent successfully",
    };
}