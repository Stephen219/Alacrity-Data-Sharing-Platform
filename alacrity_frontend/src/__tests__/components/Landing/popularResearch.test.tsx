import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import TrendingResearchCarousel from "@/components/Landing/popularResearch";
import { useRouter } from "next/navigation";

// Mock router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("swiper/react", () => ({
  Swiper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swiper">{children}</div>
  ),
  SwiperSlide: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swiper-slide">{children}</div>
  ),
}));

jest.mock("swiper/css", () => {});
jest.mock("swiper/css/pagination", () => {});
jest.mock("swiper/modules", () => ({
  Pagination: {},
  Autoplay: {},
}));

describe("TrendingResearchCarousel Component", () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    pushMock.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
  });

  test("renders Skeleton while loading", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    render(<TrendingResearchCarousel />);
    const skeleton = document.querySelector(".w-full.h-40");
    expect(skeleton).toBeInTheDocument();
  });

  test("renders popular submissions when available and handles card click", async () => {
    const mockData = {
      popular_submissions: [
        {
          id: 1,
          title: "Popular Submission 1",
          summary: "Summary for popular submission",
          submitted_at: "2023-03-10T12:00:00Z",
          image: "http://example.com/image1.jpg",
          bookmark_count: 10,
          full_name: "Author One",
        },
      ],
      recent_submissions: [
        {
          id: 2,
          title: "Recent Submission 1",
          summary: "Summary for recent submission",
          submitted_at: "2023-03-11T12:00:00Z",
          image: "http://example.com/image2.jpg",
          bookmark_count: 5,
          full_name: "Author Two",
        },
      ],
    };

    // Mock fetch to return popular submissions
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    render(<TrendingResearchCarousel />);

    // Wait until the popular submission title appears 
    const submissionTitle = await screen.findByText("Popular Submission 1");
    expect(submissionTitle).toBeInTheDocument();
    expect(screen.getByText("Summary for popular submission")).toBeInTheDocument();
    expect(screen.getByAltText("Popular Submission 1")).toBeInTheDocument();

    // Simulate clicking on the submission to trigger router.push
    fireEvent.click(submissionTitle);
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/researcher/allSubmissions/view/1")
    );
  });

  test("renders recent submissions when popular submissions are empty", async () => {
    const mockData = {
      popular_submissions: [],
      recent_submissions: [
        {
          id: 2,
          title: "Recent Submission 1",
          summary: "Summary for recent submission",
          submitted_at: "2023-03-11T12:00:00Z",
          image: "invalidImage",
          bookmark_count: 5,
          full_name: "Author Two",
        },
      ],
    };

    // Mock fetch to return data with empty popular submissions
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    render(<TrendingResearchCarousel />);
    
    const recentTitle = await screen.findByText("Recent Submission 1");
    expect(recentTitle).toBeInTheDocument();
    expect(screen.getByText("Summary for recent submission")).toBeInTheDocument();
    expect(screen.queryByAltText("Recent Submission 1")).toBeNull();
  });

  test("handles fetch error gracefully", async () => {

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Fetch failed"));
    render(<TrendingResearchCarousel />);
    await waitFor(() =>
      expect(screen.getByText("Featured Research")).toBeInTheDocument()
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch submissions:",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});
