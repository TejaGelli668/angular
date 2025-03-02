import { Component, OnInit } from '@angular/core';
import { AccessRequestService } from 'src/app/services/access-request.service';

@Component({
  selector: 'app-access-request',
  templateUrl: './access-request.component.html',
  styleUrls: ['./access-request.component.css']
})
export class AccessRequestComponent implements OnInit {
 
  // Properties
  currentView: string = 'pending';
  dropdownOpen: boolean = false;
 
  showRequestForm: boolean = false;
  showChangeAccessModal: boolean = false;
  showDeleteConfirmationModal: boolean = false;
  showApprovalRejectionModal: boolean = false;
  confirmationAction: string = '';
  selectedRequest: any = null;
  selectedRequestForApproval: any = null;
  selectedRolesForApproval: any = null;
 
  newAccessType: string = '';
  selectedRolesForDeletion: string[] = [];
  selectedRequestForDeletion: any = null;
 
  requests = this.accessRequestService.requests;
  accessTypes: string[] = ['NCR_NHR', 'MSR_MCR', 'HPC_HRC'];
  newRequest = { sso: '', name: '', email: '', accessType: '', roles: [] as string[], comments: '' };
  availableRoles: string[] = ['CFM', 'Correction', 'CSL', 'Disposition', 'Process Quality Engineer', 'Quality Inspector', 'Technician', 'TPM'];
 
  constructor(public accessRequestService: AccessRequestService) {}
  
  ngOnInit(): void {
    // Fetch initial data from backend
    this.accessRequestService.fetchAllRequests();
  }
 
  // Function to change view between pending, approved, and rejected
  setView(view: string) {
    this.currentView = view;
  }
 
  openRequestForm() {
    this.showRequestForm = true;
  }
 
  closeRequestForm() {
    this.showRequestForm = false;
  }
 
  toggleRole(role: string) {
    const index = this.newRequest.roles.indexOf(role);
    if (index === -1) {
      this.newRequest.roles.push(role);
    } else {
      this.newRequest.roles.splice(index, 1);
    }
  }
 
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
 
  submitRequest() {
    console.log('Request being submitted:', this.newRequest);
    console.log('Comments:', this.newRequest.comments);
    if (!this.newRequest.sso || !this.newRequest.name || !this.newRequest.email || !this.newRequest.accessType || this.newRequest.roles.length === 0) {
      alert('Please fill all required fields and select at least one role.');
      return;
    }
 
    // Submit to backend via service
    this.accessRequestService.addRequest(this.newRequest).subscribe(
      response => {
        // Reset form
        this.newRequest = { sso: '', name: '', email: '', accessType: '', roles: [], comments: '' };
        this.showRequestForm = false;
      },
      error => {
        console.error('Error submitting request:', error);
        alert('There was an error submitting your request. Please try again.');
      }
    );
  }
 
  toggleRoleSelection(request: any, role: string) {
    if (!request.highlightedRoles) {
      request.highlightedRoles = [];
    }
 
    const index = request.highlightedRoles.indexOf(role);
    if (index === -1) {
      request.highlightedRoles.push(role);
    } else {
      request.highlightedRoles.splice(index, 1);
    }
  }
 
  toggleHighlight(request: any, role: string) {
    if (!request.highlightedRoles) {
      request.highlightedRoles = [];
    }
 
    const index = request.highlightedRoles.indexOf(role);
    if (index === -1) {
      request.highlightedRoles.push(role);
    } else {
      request.highlightedRoles.splice(index, 1);
    }
  }
 
  approveRequest(request: any) {
    if (!request.highlightedRoles || request.highlightedRoles.length === 0) {
      alert('Please select at least one role to approve.');
      return;
    }
 
    this.selectedRequest = request;
    this.confirmationAction = 'Approve';
    this.showApprovalRejectionModal = true;
  }
 
  rejectRequest(request: any) {
    if (!request.highlightedRoles || request.highlightedRoles.length === 0) {
      alert('Please select at least one role to reject.');
      return;
    }
 
    this.selectedRequest = request;
    this.confirmationAction = 'Reject';
    this.showApprovalRejectionModal = true;
  }
 
  confirmAction() {
    if (this.confirmationAction === 'Approve') {
      this.approveRoles(this.selectedRequest);
    } else if (this.confirmationAction === 'Reject') {
      this.rejectRoles(this.selectedRequest);
    }
 
    this.showApprovalRejectionModal = false;
  }
 
  approveRoles(request: any) {
    // Call service to approve roles via API
    this.accessRequestService.approveRoles(request, request.highlightedRoles).subscribe(
      response => {
        // Success - UI is updated by the service
      },
      error => {
        console.error('Error approving roles:', error);
      }
    );
  }
 
  rejectRoles(request: any) {
    // Call service to reject roles via API
    this.accessRequestService.rejectRoles(request, request.highlightedRoles).subscribe(
      response => {
        // Success - UI is updated by the service
      },
      error => {
        console.error('Error rejecting roles:', error);
      }
    );
  }
 
  cancelAction() {
    this.showDeleteConfirmationModal = false;
    this.showApprovalRejectionModal = false;
  }
 
  closeChangeAccessModal() {
    this.showChangeAccessModal = false;
  }
 
  openChangeAccessModal(request: any) {
    this.selectedRequest = request;
    this.newAccessType = request.accessType;
    this.showChangeAccessModal = true;
  }
 
  changeAccessType() {
    // Call service to update access type via API
    this.accessRequestService.updateAccessType(this.selectedRequest, this.newAccessType).subscribe(
      response => {
        this.showChangeAccessModal = false;
      },
      error => {
        console.error('Error changing access type:', error);
        this.showChangeAccessModal = false;
      }
    );
  }

  openDeleteConfirmationModal(request: any) {
    this.selectedRequestForDeletion = request;
    this.selectedRolesForDeletion = request.roles.filter((role: any) => role.selected).map((role: any) => role.name);
    
    if (this.selectedRolesForDeletion.length === 0) {
      alert('Please select at least one role to delete.');
      return;
    }
    
    this.showDeleteConfirmationModal = true;
  }
 
  deleteApprovedSelectedRoles() {
    if (!this.selectedRequestForDeletion) return;
    
    // Call service to delete roles via API
    this.accessRequestService.deleteApprovedRoles(
      this.selectedRequestForDeletion, 
      this.selectedRolesForDeletion
    ).subscribe(
      response => {
        // Reset selection and hide modal - UI updated by service
        this.selectedRequestForDeletion = null;
        this.selectedRolesForDeletion = [];
        this.showDeleteConfirmationModal = false;
      },
      error => {
        console.error('Error deleting roles:', error);
        this.showDeleteConfirmationModal = false;
      }
    );
  }

  openApprovalRejectionModal(request: any, action: string) {
    this.selectedRequestForApproval = request;
    this.confirmationAction = action;
    this.selectedRolesForApproval = request.roles.filter((role: any) => role.selected).map((role: any) => role.name);
    
    if (this.selectedRolesForApproval.length === 0) {
      alert(`Please select at least one role to ${action.toLowerCase()}.`);
      return;
    }
    
    this.showApprovalRejectionModal = true;
  }
 
  cancelDeleteAction() {
    this.showDeleteConfirmationModal = false;
    this.showApprovalRejectionModal = false;
  }
}