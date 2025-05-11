export interface Website {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  domain: string;
}

export interface DomainEntry {
  id: string;
  name: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  verifiedAt: string | null;
  createdAt: string;
  userId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerImage: string | null;
  websites: Website[] | null;
} 