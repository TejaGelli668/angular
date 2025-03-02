import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccessRequestService {
  private apiUrl = 'http://localhost:8080/api/requests'; // Your API endpoint
  requests = {
    pending: [] as any[],
    approved: [] as any[],
    rejected: [] as any[]
  };

  constructor(private http: HttpClient) {
    // Load initial data from backend
    this.fetchAllRequests();
  }

  // Fetch all requests from backend and organize by status
  fetchAllRequests(): void {
    this.http.get<any[]>(this.apiUrl).subscribe(
      (data) => {
        // Reset current data
        this.requests.pending = [];
        this.requests.approved = [];
        this.requests.rejected = [];
        
        // Organize requests by status
        data.forEach(request => {
          if (request.status === 'pending') {
            this.requests.pending.push(request);
          } else if (request.status === 'approved') {
            this.requests.approved.push(request);
          } else if (request.status === 'rejected') {
            this.requests.rejected.push(request);
          }
        });
      },
      (error) => {
        console.error('Error fetching requests:', error);
        // Fallback to localStorage if API call fails
        this.loadFromLocalStorage();
      }
    );
  }

  // Fallback method to load from localStorage
  loadFromLocalStorage(): void {
    const storedRequests = JSON.parse(localStorage.getItem('requests') || '{}');
    if (storedRequests.pending) {
      this.requests.pending = storedRequests.pending;
    }
    if (storedRequests.approved) {
      this.requests.approved = storedRequests.approved;
    }
    if (storedRequests.rejected) {
      this.requests.rejected = storedRequests.rejected;
    }
  }

  // Save data to localStorage as backup
  saveToLocalStorage(): void {
    localStorage.setItem('requests', JSON.stringify(this.requests));
  }

  // Add new request and save it to the server
  addRequest(request: any): Observable<any> {
    // Add status field for backend compatibility
    const requestWithStatus = { ...request, status: 'pending' };
    
    return this.http.post<any>(this.apiUrl, requestWithStatus).pipe(
      tap(newRequest => {
        // Add to local pending list after successful API call
        this.requests.pending.push(newRequest);
        this.saveToLocalStorage();
      }),
      catchError(error => {
        console.error('Error adding request:', error);
        // Fallback: add locally if API fails
        this.requests.pending.push(requestWithStatus);
        this.saveToLocalStorage();
        return of(requestWithStatus);
      })
    );
  }

  // Approve request roles
  approveRoles(request: any, approvedRoles: string[]): Observable<any> {
    // Check if request has an ID from backend
    if (request.id) {
      return this.http.put<any>(`${this.apiUrl}/${request.id}/approve`, { roles: approvedRoles }).pipe(
        tap(updatedRequest => {
          this.updateLocalLists(request, approvedRoles, 'approved');
          this.saveToLocalStorage();
        }),
        catchError(error => {
          console.error('Error approving request:', error);
          // Fallback: update locally
          this.updateLocalLists(request, approvedRoles, 'approved');
          this.saveToLocalStorage();
          return of(request);
        })
      );
    } else {
      // No ID, just update locally
      this.updateLocalLists(request, approvedRoles, 'approved');
      this.saveToLocalStorage();
      return of(request);
    }
  }

  // Reject request roles
  rejectRoles(request: any, rejectedRoles: string[]): Observable<any> {
    if (request.id) {
      return this.http.put<any>(`${this.apiUrl}/${request.id}/reject`, { roles: rejectedRoles }).pipe(
        tap(updatedRequest => {
          this.updateLocalLists(request, rejectedRoles, 'rejected');
          this.saveToLocalStorage();
        }),
        catchError(error => {
          console.error('Error rejecting request:', error);
          // Fallback: update locally
          this.updateLocalLists(request, rejectedRoles, 'rejected');
          this.saveToLocalStorage();
          return of(request);
        })
      );
    } else {
      // No ID, just update locally
      this.updateLocalLists(request, rejectedRoles, 'rejected');
      this.saveToLocalStorage();
      return of(request);
    }
  }

  // Helper method to update local lists after approval/rejection
  private updateLocalLists(request: any, rolesToMove: string[], targetStatus: 'approved' | 'rejected'): void {
    // Format roles as needed for display
    const formattedRoles = rolesToMove.map(role => ({ name: role, selected: false }));
    
    // Add to target list (approved or rejected)
    this.requests[targetStatus].push({
      id: request.id,
      sso: request.sso,
      name: request.name,
      email: request.email,
      accessType: request.accessType,
      roles: formattedRoles,
      comments: request.comments,
      status: targetStatus
    });
    
    // Remove processed roles from pending request
    request.roles = request.roles.filter((role: any) => 
      !rolesToMove.includes(typeof role === 'string' ? role : role.name));
    
    // If no roles left, remove from pending
    if (request.roles.length === 0) {
      this.requests.pending = this.requests.pending.filter(r => r !== request);
    }
    
    // Reset highlighted roles
    request.highlightedRoles = [];
  }

  // Update access type of an approved request
  updateAccessType(request: any, newAccessType: string): Observable<any> {
    if (request.id) {
      return this.http.put<any>(`${this.apiUrl}/${request.id}/accessType`, newAccessType).pipe(
        tap(updatedRequest => {
          // Update local data
          const foundRequest = this.requests.approved.find(r => r.id === request.id);
          if (foundRequest) {
            foundRequest.accessType = newAccessType;
          }
          this.saveToLocalStorage();
        }),
        catchError(error => {
          console.error('Error updating access type:', error);
          // Update locally anyway
          const foundRequest = this.requests.approved.find(r => r === request);
          if (foundRequest) {
            foundRequest.accessType = newAccessType;
          }
          this.saveToLocalStorage();
          return of(request);
        })
      );
    } else {
      // No ID, just update locally
      const foundRequest = this.requests.approved.find(r => r === request);
      if (foundRequest) {
        foundRequest.accessType = newAccessType;
      }
      this.saveToLocalStorage();
      return of(request);
    }
  }

  // Delete approved roles
  deleteApprovedRoles(request: any, rolesToDelete: string[]): Observable<any> {
    if (request.id) {
      return this.http.put<any>(`${this.apiUrl}/${request.id}`, { rolesToDelete }).pipe(
        tap(() => {
          this.deleteRolesLocally(request, rolesToDelete);
          this.saveToLocalStorage();
        }),
        catchError(error => {
          console.error('Error deleting roles:', error);
          // Fallback: delete locally
          this.deleteRolesLocally(request, rolesToDelete);
          this.saveToLocalStorage();
          return of(request);
        })
      );
    } else {
      // No ID, just update locally
      this.deleteRolesLocally(request, rolesToDelete);
      this.saveToLocalStorage();
      return of(request);
    }
  }

  // Helper to delete roles from local data
  private deleteRolesLocally(request: any, rolesToDelete: string[]): void {
    // Remove selected roles
    request.roles = request.roles.filter((role: any) => 
      !rolesToDelete.includes(typeof role === 'string' ? role : role.name));
    
    // If no roles left, remove the request
    if (request.roles.length === 0) {
      this.requests.approved = this.requests.approved.filter(r => r !== request);
    }
  }

  // Delete an entire request
  deleteRequest(request: any): Observable<void> {
    if (request.id) {
      return this.http.delete<void>(`${this.apiUrl}/${request.id}`).pipe(
        tap(() => {
          // Remove from local list
          this.requests.approved = this.requests.approved.filter(r => r !== request);
          this.saveToLocalStorage();
        }),
        catchError(error => {
          console.error('Error deleting request:', error);
          // Fallback: delete locally
          this.requests.approved = this.requests.approved.filter(r => r !== request);
          this.saveToLocalStorage();
          return of(undefined);
        })
      );
    } else {
      // No ID, just delete locally
      this.requests.approved = this.requests.approved.filter(r => r !== request);
      this.saveToLocalStorage();
      return of(undefined);
    }
  }
}