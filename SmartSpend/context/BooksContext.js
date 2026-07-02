// context/BooksContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../utils/api";
import { AuthContext } from "./AuthContext";

const BooksContext = createContext(null);

export function BooksProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [activeBookId, setActiveBookId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshBooks = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/cashbooks');
      const data = res.data?.data || [];
      setBooks(data);
      setActiveBookId((prev) => prev || (data.length > 0 ? data[0].id : null));
    } catch (e) {
      console.log("Failed to load books", e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setBooks([]);
      setActiveBookId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshBooks().finally(() => setLoading(false));
  }, [user, refreshBooks]);

  const addBook = async ({ name, description, color }) => {
    try {
      const res = await api.post('/cashbooks', {
        name,
        description: description || "",
        color: color || "#2563EB",
        currency: (user ? user.defaultCurrency : null) || "INR"
      });
      const newBook = res.data.data;
      setBooks((prev) => [newBook, ...prev]);
      if (!activeBookId) setActiveBookId(newBook.id);
      return newBook;
    } catch (e) {
      console.log('Error adding book', e);
      return null;
    }
  };

  const updateBook = async (id, updates) => {
    try {
      const res = await api.patch(`/cashbooks/${id}`, updates);
      const updatedBook = res.data.data;
      setBooks((prev) => prev.map((b) => b.id === id ? updatedBook : b));
      return updatedBook;
    } catch (e) {
      console.log('Error updating book', e);
      return null;
    }
  };

  const setActiveBook = (id) => {
    setActiveBookId(id);
  };

  const clearAllBooks = async () => {
    setBooks([]);
    setActiveBookId(null);
  };

  const deleteBook = async (id) => {
    try {
      await api.delete(`/cashbooks/${id}`);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      setActiveBookId((prevId) => {
        if (prevId === id) {
          const remaining = books.filter((b) => b.id !== id);
          return remaining.length > 0 ? remaining[0].id : null;
        }
        return prevId;
      });
    } catch(e) {
      console.log("Error deleting book", e);
    }
  };

  const activeBook = books.find((b) => b.id === activeBookId) || null;

  return (
    <BooksContext.Provider
      value={{
        books,
        activeBook,
        activeBookId,
        loading,
        addBook,
        updateBook,
        setActiveBook,
        clearAllBooks,
        deleteBook,
        loadBooks: refreshBooks,
        refreshBooks,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) {
    throw new Error("useBooks must be used within BooksProvider");
  }
  return ctx;
}
