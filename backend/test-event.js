async function seedMockEvent() {
    try {
        const response = await fetch('http://localhost:5000/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "AI & Cloud Development Workshop",
                description: "Learn full-stack applications with Imran and Samra.",
                date: "2026-11-15",
                time: "10:00 AM",
                location: "Main Campus Seminar Hall Room 3",
                category: "Workshop",
                capacity: 50
            })
        });
        const data = await response.json();
        console.log("Success! Event added to database:", data);
    } catch (error) {
        console.error("Failed to seed event:", error);
    }
}
seedMockEvent();
