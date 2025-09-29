// This script will verify that the chat rooms API endpoint is working correctly
// by checking if the necessary database tables exist and have data

const Database = require('better-sqlite3');
const db = new Database('internship.db');

console.log('Verifying chat system database...');

try {
  // Check if chat_rooms table exists
  const chatRoomsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_rooms'").get();
  if (!chatRoomsTable) {
    console.log('❌ chat_rooms table does not exist');
  } else {
    console.log('✅ chat_rooms table exists');
    
    // Check if there are any chat rooms
    const chatRoomsCount = db.prepare('SELECT COUNT(*) as count FROM chat_rooms').get().count;
    console.log(`📊 Chat rooms count: ${chatRoomsCount}`);
    
    if (chatRoomsCount > 0) {
      // Show sample chat room
      const sampleRoom = db.prepare('SELECT * FROM chat_rooms LIMIT 1').get();
      console.log('📋 Sample chat room:', sampleRoom);
    }
  }
  
  // Check if chat_messages table exists
  const chatMessagesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_messages'").get();
  if (!chatMessagesTable) {
    console.log('❌ chat_messages table does not exist');
  } else {
    console.log('✅ chat_messages table exists');
    
    // Check if there are any messages
    const messagesCount = db.prepare('SELECT COUNT(*) as count FROM chat_messages').get().count;
    console.log(`📊 Chat messages count: ${messagesCount}`);
    
    if (messagesCount > 0) {
      // Show sample message
      const sampleMessage = db.prepare('SELECT * FROM chat_messages LIMIT 1').get();
      console.log('💬 Sample message:', sampleMessage);
    }
  }
  
  console.log('\n✅ Chat system verification complete!');
  
} catch (error) {
  console.error('❌ Error verifying chat system:', error.message);
}

db.close();