import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserInputConfig } from '../../interfaces';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-user-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './user-input.component.html',
  styleUrl: './user-input.component.scss'
})
export class UserInputComponent {
  userInput: string;

  constructor(
    public dialogRef: MatDialogRef<UserInputComponent>,
    @Inject(MAT_DIALOG_DATA) public config: UserInputConfig
  ) {
    this.userInput = config.defaultValue || '';
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }

  onSubmit(): void {
    this.dialogRef.close(this.userInput);
  }
}
