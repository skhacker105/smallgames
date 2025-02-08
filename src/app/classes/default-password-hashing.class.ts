export class DefaultPasswordHashing {
    private static readonly salt = "random_salt_1234"; // Keep this secret
  private static readonly storedHashPromise = DefaultPasswordHashing.hashPassword("123");

  // Hashing function using Web Crypto API
  private static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + DefaultPasswordHashing.salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Function to check user input
  public static async verifyInput(userInput: string): Promise<boolean> {
    const hashedInput = await DefaultPasswordHashing.hashPassword(userInput);
    const storedHash = await DefaultPasswordHashing.storedHashPromise;
    return hashedInput === storedHash;
  }
}