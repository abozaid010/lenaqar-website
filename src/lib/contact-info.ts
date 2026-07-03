// Contact info management class for units

interface DeveloperContact {
  id: string;
  sales_phone: string;
  whatsapp: string;
}

interface ClientContact {
  client_id: string;
  phone_number: string;
  whatsapp: string | null;
}

interface ContactInfoResult {
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  type: 'Owner' | 'Developer' | 'Client' | null;
}

// Contact data is fetched through the same-origin BFF (/api/crm/*), which injects
// the X-API-Key / auth token server-side. Never import the server-only apiConfig here —
// it would leak into the client bundle and log a false "X_API_KEY is not set" error.

class ContactInfo {
  private developerContacts: Map<string, DeveloperContact> = new Map();
  private clientContacts: Map<string, ClientContact> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 60 minutes cache for better performance
  private readonly CACHE_KEY = 'lenaai_contacts_cache';

  constructor() {
    this.loadFromStorage();
  }

  // Load contacts from localStorage with proper error handling
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return; // Skip on server-side
    try {
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.developerContacts && parsed.clientContacts && parsed.lastFetchTime) {
          this.developerContacts = new Map(parsed.developerContacts);
          this.clientContacts = new Map(parsed.clientContacts);
          this.lastFetchTime = parsed.lastFetchTime;
        }
      }
    } catch (error) {
      console.warn('Failed to load contacts from cache:', error);
      // Clear corrupted cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.CACHE_KEY);
      }
    }
  }

  // Save contacts to localStorage as single cache object
  private saveToStorage(): void {
    if (typeof window === 'undefined') return; // Skip on server-side
    try {
      const cacheData = {
        developerContacts: Array.from(this.developerContacts.entries()),
        clientContacts: Array.from(this.clientContacts.entries()),
        lastFetchTime: this.lastFetchTime
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save contacts to cache:', error);
    }
  }

  // Fetch developer contacts from public API
  private async fetchDeveloperContacts(): Promise<void> {
    const response = await fetch('/api/crm/developers/get_contact', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch developer contacts: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.status || !result.data) {
      throw new Error('Invalid developer contacts response');
    }

    this.developerContacts.clear();
    result.data.forEach((dev: DeveloperContact) => {
      this.developerContacts.set(dev.id, dev);
    });
  }

  // Fetch client contacts from public API
  private async fetchClientContacts(): Promise<void> {
    const response = await fetch('/api/crm/client/public/contact_data', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch client contacts: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.status || !result.data) {
      throw new Error('Invalid client contacts response');
    }

    this.clientContacts.clear();
    result.data.forEach((client: ClientContact) => {
      this.clientContacts.set(client.client_id, client);
    });
  }

  // Refresh contacts from APIs if cache is expired
  private async refreshContactsIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetchTime > this.CACHE_DURATION) {
      await this.forceRefresh();
    }
  }

  // Get developer contact by ID - no default values
  get_developer_contact(developerId: string, developerName?: string | null): ContactInfoResult {
    const contact = this.developerContacts.get(developerId);
    
    if (!contact) {
      return {
        name: null,
        phone: null,
        whatsapp: null,
        type: null
      };
    }

    return {
      name: contact.sales_phone ? (developerName || 'Developer Sales Team') : null,
      phone: contact.sales_phone,
      whatsapp: contact.whatsapp,
      type: 'Developer'
    };
  }

  // Get client contact by ID - no default values, proper fallback
  get_client_contact(clientId: string): ContactInfoResult {
    const contact = this.clientContacts.get(clientId);
    
    if (!contact) {
      return {
        name: null,
        phone: null,
        whatsapp: null,
        type: null
      };
    }

    return {
      name: contact.phone_number ? `Client (${clientId})` : null,
      phone: contact.phone_number,
      whatsapp: contact.whatsapp || contact.phone_number, // fallback to phone_number if whatsapp null
      type: 'Client'
    };
  }

  // Main method to get contact info for a unit based on rules - strict validation
  async get_contact_info(unit: {
    clientId: string | null;
    developerId: string | null;
    isPrimary: boolean;
    ownerName: string | null;
    ownerMobile: string | null;
    developerName: string | null;
  }, currentClientId: string | null): Promise<ContactInfoResult> {
    // Refresh contacts if needed
    await this.refreshContactsIfNeeded();

    // Rule 1: Owner contact — same client as logged-in profile
    if (
      unit.clientId &&
      currentClientId &&
      unit.clientId === currentClientId &&
      (unit.ownerName || unit.ownerMobile)
    ) {
      return {
        name: unit.ownerName,
        phone: unit.ownerMobile,
        whatsapp: unit.ownerMobile,
        type: 'Owner',
      };
    }

    // Rule 2: Developer contact - isPrimary == true && developerId is valid
    if (unit.isPrimary && unit.developerId) {
      return this.get_developer_contact(unit.developerId, unit.developerName);
    }

    // Rule 3: Client contact - require valid clientId
    if (unit.clientId && !unit.isPrimary) {
      return this.get_client_contact(unit.clientId);
    }

    // No valid contact found
    return {
      name: null,
      phone: null,
      whatsapp: null,
      type: null
    };
  }

  // Force refresh contacts with proper error handling
  async forceRefresh(): Promise<void> {
    try {
      await Promise.all([
        this.fetchDeveloperContacts(),
        this.fetchClientContacts()
      ]);
      this.lastFetchTime = Date.now();
      this.saveToStorage();
    } catch (error) {
      console.error('Error refreshing contacts:', error);
      // Don't throw - allow graceful degradation with cached data
      if (this.developerContacts.size === 0 && this.clientContacts.size === 0) {
        // Only throw if we have no cached data at all
        throw new Error('Failed to load contacts: No cache available');
      }
    }
  }

  // Check if cache is valid
  isCacheValid(): boolean {
    const now = Date.now();
    return (now - this.lastFetchTime) < this.CACHE_DURATION;
  }

  // Clear cache manually
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    this.developerContacts.clear();
    this.clientContacts.clear();
    this.lastFetchTime = 0;
  }
}

// Singleton instance
export const contactInfo = new ContactInfo();
export default ContactInfo;
