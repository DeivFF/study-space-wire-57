import React from 'react';
import { useChat } from '@/contexts/ChatContext';
import { ChatWindow } from './ChatWindow';

export function ChatManager() {
  const { state } = useChat();

  // Log only when there are actual changes for debugging if needed
  // React.useEffect(() => {
  //   console.log('ChatManager - activeChats:', state.activeChats);
  // }, [state.activeChats.length]);

  // Calculate positions for multiple chat windows
  const calculatePositions = () => {
    const positions: { [key: string]: { right: number } } = {};
    const windowWidth = 380; // Width of each chat window
    const spacing = 20; // Space between windows
    
    state.activeChats.forEach((chatId, index) => {
      positions[chatId] = {
        right: 18 + (index * (windowWidth + spacing)) // Base offset + incremental positioning
      };
    });
    
    return positions;
  };

  const positions = calculatePositions();

  return (
    <>
      {state.activeChats.map((chatId) => {
        const conversation = state.conversations[chatId];
        if (!conversation) return null;

        return (
          <ChatWindow
            key={chatId}
            conversation={conversation}
            position={positions[chatId]}
          />
        );
      })}
    </>
  );
}