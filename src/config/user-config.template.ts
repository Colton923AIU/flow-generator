/**
 * User-specific configuration for flow generation
 * TEMPLATE FILE: Copy this to user-config.ts and update with your values
 */
import { PublisherInfo } from '../utils/export-solution';

/**
 * TypeScript interface for the configuration object
 */
interface FlowCreatorConfig {
  user: {
    adminEmail: string;
    distributionLists: {
      [key: string]: string;
    };
    teamMembers: {
      [key: string]: string;
    };
  };
  environment: {
    mode: string;
    dynamicsApiUrl: string;
  };
  sharePoint: {
    listMap: {
      [key: string]: string;
    };
    [key: string]: any;
  };
  connections: {
    [key: string]: string;
  };
  publisher: PublisherInfo;
  utils: {
    getEnvironmentEmails: (emails: string, adminEmail?: string, env?: string) => string;
  };
}

/**
 * Configuration for all aspects of the Flow Creator
 */
export const config: FlowCreatorConfig = {
  /**
   * User-specific configuration
   */
  user: {
    /**
     * Email to use for development/testing notifications
     */
    adminEmail: 'your.email@example.com',
    
    /**
     * Email distribution lists
     */
    distributionLists: {
      teamNotifications: 'team@example.com;',
      workflowNotifications: 'workflows@example.com;'
    },
    
    /**
     * Individual team members
     */
    teamMembers: {
      member1: 'member1@example.com',
      member2: 'member2@example.com'
    },
  },

  /**
   * Environment configuration
   */
  environment: {
    /**
     * Default environment mode: 'prod' for production, 'dev' for development
     */
    mode: 'dev',
    
    /**
     * Dynamics API URL
     */
    dynamicsApiUrl: 'https://your-org.crm.dynamics.com/api/data/v9.2'
  },

  /**
   * SharePoint configuration
   */
  sharePoint: {
    /**
     * Example SharePoint site and list
     */
    exampleList: {
      siteUrl: 'https://your-tenant.sharepoint.com/sites/YourSite',
      listId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      viewId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    },
    
    /**
     * Map of SharePoint List Names to GUIDs
     */
    listMap: {
      'ExampleList': 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    }
  },

  /**
   * Connection settings for Power Automate
   */
  connections: {
    sharePoint: 'shared_sharepointonline',
    outlook: 'shared_office365'
  },

  /**
   * Publisher information for solution packaging
   */
  publisher: {
    uniqueName: 'yourname',
    localizedName: 'YourFullName',
    prefix: 'yourprefix',
    optionValuePrefix: 12345
  },
  
  /**
   * Helper functions
   */
  utils: {
    /**
     * Get email addresses for notifications based on environment
     * @param emails The production email addresses
     * @param adminEmail The admin email for development testing
     * @param env The environment ('prod' or 'dev')
     * @returns Email addresses appropriate for the environment
     */
    getEnvironmentEmails: function(
      emails: string,
      adminEmail: string = config.user.adminEmail,
      env: string = config.environment.mode
    ): string {
      return env === 'prod' ? emails : adminEmail;
    }
  }
};

// For backward compatibility
export const userConfig = config.user;
export const commonPublisherInfo: PublisherInfo = config.publisher;
export const sharePointListMap = config.sharePoint.listMap;
export const dynamicsApiUrl = config.environment.dynamicsApiUrl;
export const defaultEnvironment = config.environment.mode;
export const getEnvironmentEmails = config.utils.getEnvironmentEmails; 