async function sendBulkEvents() {
    console.log("🚀 Starting load test: sending 50 events...");
    const promises = [];
  
    for (let i = 1; i <= 50; i++) {
      const p = fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: i % 2 === 0 ? 'click_event' : 'view_event',
          user_id: `user_${i}`,
          timestamp: new Date().toISOString(),
          index: i
        })
      }).then(res => res.json()).catch(err => ({ error: err.message }));
      
      promises.push(p);
    }
  
    const results = await Promise.all(promises);
    console.log(`✨ Finished sending 50 requests! Response summaries received: ${results.length}`);
  }
  
  sendBulkEvents();