"use client"
import { useState } from "react";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import TextEditorToolbar from "@/components/TextEditorToolbar";
import { Editor } from "@tiptap/react";
import ResearchForm from "@/components/ResearchForm";

const AnalysisForm = () => {
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  return (
    <MaxWidthWrapper>
      <section className="bg-white border border-black mt-12 shadow-2xl rounded-2xl dark:bg-gray-900 mt-48">
        <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-center dark:text-white">Submit Analysis</h2>

            <div className="sticky top-16 z-30 bg-white p-2 rounded-lg mb-4 ">
              {editorInstance && <TextEditorToolbar editor={editorInstance} />}
            </div>


          <ResearchForm editorInstance={editorInstance} setEditorInstance={setEditorInstance} />
        </div>
      </section>
    </MaxWidthWrapper>
  );
};

export default AnalysisForm;
