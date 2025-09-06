interface DuvidaPostProps {
  title?: string;
  content: string;
  tags?: string[];
}

const DuvidaPost: React.FC<DuvidaPostProps> = ({ title, content, tags }) => {
  return (
    <div className="study-post-text">
      {title && <p className="font-bold mb-3">{title}</p>}
      <p>{content}</p>
      {tags && tags.length > 0 && (
        <div className="row gap-2" style={{marginTop: '8px'}}>
          {tags.map((tag, index) => (
            <span key={index} className="chip">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DuvidaPost;