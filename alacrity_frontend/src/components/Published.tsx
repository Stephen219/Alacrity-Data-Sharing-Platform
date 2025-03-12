"use client";

import parse from "html-react-parser";

interface Analysis {
  id: number;
  title: string;
  summary: string;
  status?:string;
}

interface AnalysisListViewProps {
  submissions: Analysis[];
  sortOrder: "newest" | "oldest";
  setSortOrder: (order: "newest" | "oldest") => void;
  renderButtons: (id: number, status?: string) => React.ReactNode;
  header: string;
}

const AnalysisListView = ({
  submissions,
  sortOrder,
  setSortOrder,
  renderButtons,
  header,
}: AnalysisListViewProps) => {
  return (
    <>
      <div className="flex justify-end mt-24">
        <select
          id="sortOrder"
          className="border p-2 rounded hover:bg-gray-100 hover:border-black rounded-lg dark:bg-gray-500"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
        </select>
      </div>
      <div className="py-2 mx-auto text-center items-center max-w-3xl">
        <h2 className="text-2xl font-bold sm:text-5xl tracking-tight mb-16">{header}</h2>
        {submissions.length === 0 ? (
          <p>No submissions found.</p>
        ) : (
          <ul className="space-y-8">
            {submissions.map((submission) => (
              <li
                key={submission.id}
                className="h-64 border rounded-lg p-6 gap-8 flex justify-between bg-white dark:bg-gray-400 dark:hover:border-white hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-500 hover:border-black"
              >
                <div className="overflow-auto scrollbar-custom">
                  <div className="text-lg dark:text-gray-100 font-semibold text-gray-800 transition-colors duration-300 ease-in-out">
                    {parse(submission.title)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-100">{parse(submission.summary)}</div>
                </div>
                {renderButtons(submission.id, submission.status)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default AnalysisListView;
