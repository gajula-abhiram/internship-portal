'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatRoom {
  room: {
    id: number;
    application_id: number;
    student_id: number;
    mentor_id: number;
    created_at: string;
    updated_at: string;
  };
  latest_message: {
    id: number;
    chat_room_id: number;
    sender_id: number;
    message: string;
    is_read: boolean;
    created_at: string;
    sender_name: string;
    sender_role: string;
  } | null;
  unread_count: number;
}

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/chat/rooms', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chat rooms');
        }

        const data = await response.json();
        setChatRooms(data.chat_rooms || []);
      } catch (error) {
        console.error('Failed to fetch chat rooms:', error);
        setError('Failed to load chat rooms. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the chat.</p>
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Chat</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Rooms</h1>
        <p className="text-gray-600">Conversations with mentors and students</p>
      </div>

      {chatRooms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Chat Rooms Yet</h3>
          <p className="text-gray-600 mb-6">
            You don't have any chat rooms yet. Chat rooms are created when you apply for internships.
          </p>
          <Link 
            href="/internships" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Browse Internships
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {chatRooms.map(({ room, latest_message, unread_count }) => (
              <li key={room.id}>
                <Link 
                  href={`/applications/${room.application_id}`}
                  className="block hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-lg font-medium text-gray-900 truncate">
                            Application #{room.application_id}
                          </p>
                          {unread_count > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                              {unread_count}
                            </span>
                          )}
                        </div>
                        {latest_message ? (
                          <div className="mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              <span className="font-medium">{latest_message.sender_name}:</span> {latest_message.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(latest_message.created_at).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">No messages yet</p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}