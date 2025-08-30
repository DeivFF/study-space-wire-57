interface PublicacaoPostProps {
  content: string;
}

const PublicacaoPost: React.FC<PublicacaoPostProps> = ({ content }) => {
  const formatContent = (content: string) => {
    const paragraphs = content.split('\n\n');
    return paragraphs.map((paragraph, index) => {
      if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
        const items = paragraph.split('\n').filter(item => item.trim());
        return (
          <ul key={index} className="list-disc list-inside space-y-1 my-3">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="leading-relaxed">
                {item.replace(/^[•-]\s*/, '')}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={index} className="mb-3 leading-relaxed">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="study-post-text">
      {formatContent(content)}
    </div>
  );
};

export default PublicacaoPost;