import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Item {
  id: number;
  name: string;
  value: string;
}

@Component({
  selector: 'app-local-storage',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './local-storage.component.html',
  styleUrl: './local-storage.component.scss'
})
export class LocalStorageComponent {

  localStorage = localStorage;
  
  keys: string[] = [];
  selectedKeys: Set<string> = new Set();
  showModal = false;

  isEditing = false;
  modalKey = '';
  modalValue = '';
  isJson = false;

  ngOnInit() {
    this.refreshKeys();
  }

  refreshKeys() {
    this.keys = Object.keys(localStorage);
  }

  openModalForEdit(key: string) {
    this.isEditing = true;
    this.modalKey = key;
    const value = localStorage.getItem(key);
    this.tryFormatValue(value ?? '');
    this.showModal = true;
  }

  openModalForAdd() {
    this.isEditing = false;
    this.modalKey = '';
    this.modalValue = '';
    this.isJson = false;
    this.showModal = true;
  }

  tryFormatValue(value: string) {
    try {
      const obj = JSON.parse(value);
      this.modalValue = JSON.stringify(obj, null, 2);
      this.isJson = true;
    } catch {
      this.modalValue = value;
      this.isJson = false;
    }
  }

  saveOrUpdate() {
    try {
      if (this.isJson) {
        const parsed = JSON.parse(this.modalValue);
        localStorage.setItem(this.modalKey, JSON.stringify(parsed));
      } else {
        localStorage.setItem(this.modalKey, this.modalValue);
      }
      this.refreshKeys();
      this.closeModal();
    } catch (e) {
      alert('Invalid JSON!');
    }
  }

  deleteKey(key: string) {
    localStorage.removeItem(key);
    this.refreshKeys();
    this.closeModal();
  }

  deleteSelected() {
    this.selectedKeys.forEach(key => localStorage.removeItem(key));
    this.selectedKeys.clear();
    this.refreshKeys();
  }

  closeModal() {
    this.showModal = false;
  }

  toggleSelection(key: string) {
    if (this.selectedKeys.has(key)) {
      this.selectedKeys.delete(key);
    } else {
      this.selectedKeys.add(key);
    }
  }

  isKeySelected(key: string): boolean {
    return this.selectedKeys.has(key);
  }

  isJsonPreview(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }
}
