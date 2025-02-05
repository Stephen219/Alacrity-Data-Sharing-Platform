// src/app/datasets/page.test.tsx
import { render, screen } from "@testing-library/react"
import '@testing-library/jest-dom'
import DatasetForm from "@/components/dataForm"

describe("DatasetForm", () => {
  it("renders without crashing", () => {
    render(<DatasetForm />)
    
    // Check for form existence
    const form = screen.getByTestId('dataset-form')
    expect(form).toBeInTheDocument()
  })



//   it ("renders the form correctly", () => {

//     render(<DatasetForm />)
//     expect(screen.getByLabelText(/Dataset Name/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/Dataset Description/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/Dataset Type/i)).toBeInTheDocument();
//     expect(screen.getByText(/Upload Dataset/i)).toBeInTheDocument();
//   })

  // ... other tests
})