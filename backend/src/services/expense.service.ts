import { Client } from '@microsoft/microsoft-graph-client';
import { Expense, MonthlyExpenseReport } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ExpenseService {
  private readonly EXPENSES_ROOT_FOLDER = 'NI-Expenses';

  private getClient(accessToken: string) {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Ensure the root expenses folder exists
   */
  private async ensureRootFolder(accessToken: string): Promise<string> {
    const client = this.getClient(accessToken);

    try {
      // Try to get the folder
      const response = await client
        .api('/me/drive/root/children')
        .filter(`name eq '${this.EXPENSES_ROOT_FOLDER}'`)
        .get();

      if (response.value && response.value.length > 0) {
        return response.value[0].id;
      }

      // Create the folder if it doesn't exist
      const folder = await client
        .api('/me/drive/root/children')
        .post({
          name: this.EXPENSES_ROOT_FOLDER,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });

      return folder.id;
    } catch (error) {
      console.error('Error ensuring root folder:', error);
      throw error;
    }
  }

  /**
   * Ensure user folder exists
   */
  private async ensureUserFolder(accessToken: string, user: string): Promise<string> {
    const client = this.getClient(accessToken);
    const rootFolderId = await this.ensureRootFolder(accessToken);

    try {
      const response = await client
        .api(`/me/drive/items/${rootFolderId}/children`)
        .filter(`name eq '${user}'`)
        .get();

      if (response.value && response.value.length > 0) {
        return response.value[0].id;
      }

      const folder = await client
        .api(`/me/drive/items/${rootFolderId}/children`)
        .post({
          name: user,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });

      return folder.id;
    } catch (error) {
      console.error('Error ensuring user folder:', error);
      throw error;
    }
  }

  /**
   * Ensure year/month folder exists
   */
  private async ensureMonthFolder(
    accessToken: string,
    user: string,
    year: string,
    month: string
  ): Promise<string> {
    const client = this.getClient(accessToken);
    const userFolderId = await this.ensureUserFolder(accessToken, user);

    // Create year folder
    let yearFolderId: string;
    try {
      const yearResponse = await client
        .api(`/me/drive/items/${userFolderId}/children`)
        .filter(`name eq '${year}'`)
        .get();

      if (yearResponse.value && yearResponse.value.length > 0) {
        yearFolderId = yearResponse.value[0].id;
      } else {
        const yearFolder = await client
          .api(`/me/drive/items/${userFolderId}/children`)
          .post({
            name: year,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename',
          });
        yearFolderId = yearFolder.id;
      }
    } catch (error) {
      console.error('Error ensuring year folder:', error);
      throw error;
    }

    // Create month folder
    try {
      const monthResponse = await client
        .api(`/me/drive/items/${yearFolderId}/children`)
        .filter(`name eq '${month}'`)
        .get();

      if (monthResponse.value && monthResponse.value.length > 0) {
        return monthResponse.value[0].id;
      }

      const monthFolder = await client
        .api(`/me/drive/items/${yearFolderId}/children`)
        .post({
          name: month,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });

      return monthFolder.id;
    } catch (error) {
      console.error('Error ensuring month folder:', error);
      throw error;
    }
  }

  /**
   * Create a new expense
   */
  async createExpense(
    accessToken: string,
    user: string,
    description: string,
    value: number,
    expenseDate: string,
    file: Express.Multer.File
  ): Promise<Expense> {
    const client = this.getClient(accessToken);
    const expenseId = uuidv4();
    const submittedAt = new Date().toISOString();

    // Parse expense date to get year and month
    const date = new Date(expenseDate);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Ensure folder structure exists
    const monthFolderId = await this.ensureMonthFolder(accessToken, user, year, month);

    // Create expense folder
    const expenseFolder = await client
      .api(`/me/drive/items/${monthFolderId}/children`)
      .post({
        name: `expense-${expenseId}`,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      });

    // Upload the expense file
    const uploadedFile = await client
      .api(`/me/drive/items/${expenseFolder.id}:/${file.originalname}:/content`)
      .put(file.buffer);

    // Create expense metadata
    const expense: Expense = {
      id: expenseId,
      user,
      description,
      value,
      expenseDate,
      fileName: file.originalname,
      fileId: uploadedFile.id,
      state: 'recebida',
      submittedAt,
    };

    // Save metadata as JSON
    const metadataContent = JSON.stringify(expense, null, 2);
    await client
      .api(`/me/drive/items/${expenseFolder.id}:/metadata.json:/content`)
      .put(metadataContent);

    return expense;
  }

  /**
   * Get all expenses for a user in a specific month
   */
  async getExpensesByMonth(
    accessToken: string,
    user: string,
    year: string,
    month: string
  ): Promise<Expense[]> {
    const client = this.getClient(accessToken);

    try {
      const monthFolderId = await this.ensureMonthFolder(accessToken, user, year, month);

      // Get all expense folders
      const response = await client
        .api(`/me/drive/items/${monthFolderId}/children`)
        .get();

      const expenses: Expense[] = [];

      for (const folder of response.value) {
        if (folder.folder) {
          try {
            // Get metadata.json from each expense folder
            const metadataResponse = await client
              .api(`/me/drive/items/${folder.id}:/metadata.json:/content`)
              .get();

            expenses.push(metadataResponse as Expense);
          } catch (error) {
            console.error(`Error reading metadata for folder ${folder.name}:`, error);
          }
        }
      }

      return expenses;
    } catch (error) {
      console.error('Error getting expenses by month:', error);
      return [];
    }
  }

  /**
   * Get all expenses for a user
   */
  async getAllExpensesByUser(accessToken: string, user: string): Promise<Expense[]> {
    const client = this.getClient(accessToken);
    const expenses: Expense[] = [];

    try {
      const userFolderId = await this.ensureUserFolder(accessToken, user);

      // Get all year folders
      const yearFolders = await client
        .api(`/me/drive/items/${userFolderId}/children`)
        .get();

      for (const yearFolder of yearFolders.value) {
        if (yearFolder.folder) {
          // Get all month folders
          const monthFolders = await client
            .api(`/me/drive/items/${yearFolder.id}/children`)
            .get();

          for (const monthFolder of monthFolders.value) {
            if (monthFolder.folder) {
              // Get all expense folders
              const expenseFolders = await client
                .api(`/me/drive/items/${monthFolder.id}/children`)
                .get();

              for (const expenseFolder of expenseFolders.value) {
                if (expenseFolder.folder) {
                  try {
                    const metadataResponse = await client
                      .api(`/me/drive/items/${expenseFolder.id}:/metadata.json:/content`)
                      .get();

                    expenses.push(metadataResponse as Expense);
                  } catch (error) {
                    console.error(`Error reading metadata for ${expenseFolder.name}:`, error);
                  }
                }
              }
            }
          }
        }
      }

      return expenses;
    } catch (error) {
      console.error('Error getting all expenses by user:', error);
      return [];
    }
  }

  /**
   * Update expense state
   */
  async updateExpenseState(
    accessToken: string,
    user: string,
    expenseId: string,
    newState: 'recebida' | 'paga' | 'rejeitada'
  ): Promise<Expense | null> {
    const client = this.getClient(accessToken);

    try {
      // Get all expenses to find the one we need
      const allExpenses = await this.getAllExpensesByUser(accessToken, user);
      const expense = allExpenses.find(e => e.id === expenseId);

      if (!expense) {
        return null;
      }

      // Parse expense date to get folder path
      const date = new Date(expense.expenseDate);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      const monthFolderId = await this.ensureMonthFolder(accessToken, user, year, month);

      // Get expense folder
      const response = await client
        .api(`/me/drive/items/${monthFolderId}/children`)
        .filter(`name eq 'expense-${expenseId}'`)
        .get();

      if (!response.value || response.value.length === 0) {
        return null;
      }

      const expenseFolderId = response.value[0].id;

      // Update expense state
      const updatedExpense: Expense = {
        ...expense,
        state: newState,
      };

      // Save updated metadata
      const metadataContent = JSON.stringify(updatedExpense, null, 2);
      await client
        .api(`/me/drive/items/${expenseFolderId}:/metadata.json:/content`)
        .put(metadataContent);

      return updatedExpense;
    } catch (error) {
      console.error('Error updating expense state:', error);
      return null;
    }
  }

  /**
   * Get monthly report for a user
   */
  async getMonthlyReport(
    accessToken: string,
    user: string,
    year: string,
    month: string
  ): Promise<MonthlyExpenseReport> {
    const expenses = await this.getExpensesByMonth(accessToken, user, year, month);

    const total = expenses.reduce((sum, expense) => sum + expense.value, 0);

    const countByState = {
      recebida: expenses.filter(e => e.state === 'recebida').length,
      paga: expenses.filter(e => e.state === 'paga').length,
      rejeitada: expenses.filter(e => e.state === 'rejeitada').length,
    };

    return {
      user,
      month: `${year}-${month}`,
      expenses,
      total,
      countByState,
    };
  }

  /**
   * Get expense file download URL
   */
  async getExpenseFileUrl(
    accessToken: string,
    user: string,
    expenseId: string
  ): Promise<string | null> {
    const client = this.getClient(accessToken);

    try {
      const allExpenses = await this.getAllExpensesByUser(accessToken, user);
      const expense = allExpenses.find(e => e.id === expenseId);

      if (!expense || !expense.fileId) {
        return null;
      }

      const file = await client
        .api(`/me/drive/items/${expense.fileId}`)
        .get();

      return file['@microsoft.graph.downloadUrl'] || null;
    } catch (error) {
      console.error('Error getting expense file URL:', error);
      return null;
    }
  }
}

export const expenseService = new ExpenseService();
