"use client";
import parse from "html-react-parser";

const DisplayFormattedText = ({ content }: { content: string }) => {
  if (!content) return null; 

  console.log("Rendering Content:", content);
  
  return <div className="prose">{parse(content)}</div>;
};

export default DisplayFormattedText;
