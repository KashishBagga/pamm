"""
Encryption utilities for application-level data protection.
Uses AES-256-GCM for authenticated encryption.
"""
import base64
import os
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

class EncryptionManager:
    """
    Handles AES-256-GCM encryption and decryption.
    """
    def __init__(self, key: str = settings.ENCRYPTION_KEY):
        try:
            # The key should be 32 bytes for AES-256
            self.key = base64.b64decode(key)
            if len(self.key) != 32:
                raise ValueError("Encryption key must be 32 bytes (decoded).")
            self.aesgcm = AESGCM(self.key)
        except Exception as e:
            print(f"Error initializing EncryptionManager: {e}")
            raise

    def encrypt(self, data: str) -> str:
        """
        Encrypts a string using AES-256-GCM.
        Returns a base64 encoded string containing nonce + ciphertext.
        """
        if not data:
            return ""
        
        nonce = os.urandom(12)  # Recommended nonce size for GCM
        ciphertext = self.aesgcm.encrypt(nonce, data.encode('utf-8'), None)
        
        # Combine nonce and ciphertext for storage
        encrypted_data = nonce + ciphertext
        return base64.b64encode(encrypted_data).decode('utf-8')

    def decrypt(self, encrypted_str: str) -> str:
        """
        Decrypts a base64 encoded string using AES-256-GCM.
        """
        if not encrypted_str:
            return ""
        
        try:
            encrypted_data = base64.b64decode(encrypted_str)
            nonce = encrypted_data[:12]
            ciphertext = encrypted_data[12:]
            
            decrypted_data = self.aesgcm.decrypt(nonce, ciphertext, None)
            return decrypted_data.decode('utf-8')
        except Exception as e:
            print(f"Decryption error: {e}")
            return "[DECRYPTION_ERROR]"

# Singleton instance
encryption_manager = EncryptionManager()
