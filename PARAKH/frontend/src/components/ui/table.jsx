import * as React from "react";

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <table className={"w-full text-sm text-left rtl:text-right text-muted-foreground " + (className || "")} ref={ref}>
    <thead>{props.children}</thead>
  </table>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={"border-b " + (className || "")} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={"divide-y " + (className || "")} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={"border-t " + (className || "")} {...props} />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={"border-b " + (className || "")} {...props} />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} scope="col" className={"px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider " + (className || "")} {...props} />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={"px-6 py-4 " + (className || "")} {...props} />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell };