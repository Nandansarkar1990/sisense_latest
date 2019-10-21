// Type definitions for Sisense.js version 7.2.0
// Project: Sisensejs
// Definitions by: Takashi Binns https://gitlab.com/SisenseJS

/*~ Globally callable functions
 */

type callbackFunction = () => any;

declare class Dashboard{
    constructor();

    //~ Properties of the dashboard object
    id: string;
    refreshing: boolean;
    datasource: any;
    widgets: any;

    //~ Methods available through the dashboard object
    on(event: string, callback: callbackFunction): void;
    refresh(): void;
    renderFilter(element: any): void;
}

/*~ Sisense main object
 */
declare namespace Sisense {

    //~ We can invoke 'Sisense.connect(url)' or 'Sisense.connect(url,saveChanges);'
    function connect(url: string, saveChanges?: boolean);
}