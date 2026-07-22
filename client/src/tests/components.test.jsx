// Frontend component tests (Vitest + React Testing Library).
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

const wrap = (ui) => render(<MemoryRouter><AuthProvider>{ui}</AuthProvider></MemoryRouter>);

describe('StatusBadge', () => {
  test('shows the status text with the right class', () => {
    render(<StatusBadge status="in_progress" />);
    const badge = screen.getByText('in progress');
    expect(badge).toHaveClass('badge', 'in_progress');
  });
});

describe('Alert', () => {
  test('renders an error message', () => {
    render(<Alert>Something went wrong</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });
  test('renders nothing when there is no message', () => {
    const { container } = render(<Alert>{''}</Alert>);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Navbar', () => {
  test('shows Login/Register links when logged out', () => {
    wrap(<Navbar />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });
});

describe('Login page', () => {
  test('renders email and password fields', () => {
    wrap(<Login />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('validates empty form before calling the API', () => {
    wrap(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please fill in both fields.');
  });
});
