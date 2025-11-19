/**
 * WhatsApp Conversations Component
 * Displays list of WhatsApp conversations with messages
 */

import React, { useEffect, useState } from 'react';
import { fetchWhatsAppConversations, WhatsAppConversation } from '@/services/database';
import { formatDistanceToNow, format } from 'date-fns';

export const WhatsAppConversations: React.FC = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchWhatsAppConversations();
      setConversations(data);
      // Auto-select first conversation if available
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].conversationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      console.error('Error loading WhatsApp conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedConv = conversations.find(c => c.conversationId === selectedConversation);

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading conversations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Error loading conversations</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={loadConversations}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H7a5 5 0 01-5-5V7a5 5 0 015-5h10a5 5 0 015 5v4a5 5 0 01-5 5h-3l-4 4z"
            />
          </svg>
          <p className="mt-4 text-gray-600">No WhatsApp conversations found</p>
          <p className="text-sm text-gray-500 mt-2">Start a conversation to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
        {/* Conversations List */}
        <div className="border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Conversations</h3>
            <p className="text-sm text-gray-500 mt-1">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y divide-gray-200">
            {conversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => setSelectedConversation(conv.conversationId)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedConversation === conv.conversationId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {conv.contactName || conv.phoneNumber}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conv.messages[conv.messages.length - 1]?.content || 'No messages'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-2 flex flex-col">
          {selectedConv ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConv.contactName || selectedConv.phoneNumber}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedConv.phoneNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {selectedConv.messages.length} message{selectedConv.messages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {selectedConv.messages.map((message) => {
                  const isInbound = message.direction === 'inbound';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-2 ${
                          isInbound
                            ? 'bg-white border border-gray-200'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {message.content && (
                          <p className={`text-sm ${isInbound ? 'text-gray-900' : 'text-white'}`}>
                            {message.content}
                          </p>
                        )}
                        {message.mediaUrl && (
                          <div className="mt-2">
                            <a
                              href={message.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View {message.messageType}
                            </a>
                          </div>
                        )}
                        <div className={`flex items-center gap-2 mt-1 ${
                          isInbound ? 'text-gray-500' : 'text-blue-100'
                        }`}>
                          <span className="text-xs">
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </span>
                          {!isInbound && (
                            <span className="text-xs">
                              {message.status === 'read' && '✓✓'}
                              {message.status === 'delivered' && '✓'}
                              {message.status === 'sent' && '•'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H7a5 5 0 01-5-5V7a5 5 0 015-5h10a5 5 0 015 5v4a5 5 0 01-5 5h-3l-4 4z"
                  />
                </svg>
                <p className="mt-4">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

