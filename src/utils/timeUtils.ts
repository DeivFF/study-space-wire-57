export function getReadStatusText(readAt: string | null): string {
  if (!readAt) return '';
  
  const now = new Date();
  const readTime = new Date(readAt);
  const diffInMs = now.getTime() - readTime.getTime();
  
  // Convert to different units
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  // Return appropriate text based on time elapsed
  if (diffInSeconds < 60) {
    return 'Visto agora mesmo';
  } else if (diffInMinutes < 60) {
    return `Visto há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  } else if (diffInHours < 24) {
    return `Visto há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInDays < 7) {
    return `Visto há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  } else {
    return 'Visto há muito tempo';
  }
}

export function formatReadTime(readAt: string | null): string {
  if (!readAt) return '';
  
  const readTime = new Date(readAt);
  const now = new Date();
  const isToday = readTime.toDateString() === now.toDateString();
  
  if (isToday) {
    return readTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    return readTime.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }
}