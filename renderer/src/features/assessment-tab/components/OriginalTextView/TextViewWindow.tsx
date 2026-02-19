interface TextViewWindowProps {
  text: string;
  pendingQuote?: string;
}

export function TextViewWindow({ text, pendingQuote }: TextViewWindowProps) {
  return (
    <>
      {pendingQuote ? <div className="content-block">Pending quote: {pendingQuote}</div> : null}
      <div className="content-block">{text}</div>
    </>
  );
}
