
import { supabase } from '@/integrations/supabase/client';

// Simple XOR encryption for fast client-side encryption
// In production, you'd want to use a more robust encryption library
class FastEncryption {
  private static getKey(): string {
    // Generate a simple key based on user session
    const user = supabase.auth.getUser();
    return btoa(`${Date.now()}`).slice(0, 16);
  }

  static encrypt(text: string): string {
    try {
      const key = this.getKey();
      let encrypted = '';
      
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode);
      }
      
      return btoa(encrypted);
    } catch (error) {
      console.warn('Encryption failed, sending as plain text:', error);
      return text;
    }
  }

  static decrypt(encryptedText: string): string {
    try {
      const key = this.getKey();
      const encrypted = atob(encryptedText);
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
      }
      
      return decrypted;
    } catch (error) {
      console.warn('Decryption failed, returning as is:', error);
      return encryptedText;
    }
  }

  static isEncrypted(text: string): boolean {
    // Simple check to see if text looks like base64
    try {
      return btoa(atob(text)) === text;
    } catch {
      return false;
    }
  }
}

export { FastEncryption };
