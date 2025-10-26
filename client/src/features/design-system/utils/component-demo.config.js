import React from 'react';

import { Button } from '@/components/ui/button.jsx';

const componentDemoConfig = {
  accordion: {
    Demo: function AccordionDemo({ module }) {
      const { Accordion, AccordionItem, AccordionTrigger, AccordionContent } = module;
      if (!Accordion) return null;
      return (
        <div className='w-full max-w-xl'>
          <Accordion type='single' collapsible className='w-full rounded-lg border'>
            <AccordionItem value='item-1'>
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to WAI-ARIA best practices.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value='item-2'>
              <AccordionTrigger>Can I use it in projects?</AccordionTrigger>
              <AccordionContent>
                Absolutely, copy it into your project and customise as needed.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      );
    },
    wrapperClassName: 'p-0 justify-start',
  },
  alert: {
    getDefaultProps: ({ module }) => {
      const { AlertTitle, AlertDescription } = module;
      return {
        children: (
          <>
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can use alerts to highlight important contextual feedback.
            </AlertDescription>
          </>
        ),
      };
    },
    wrapperClassName: 'items-start justify-start text-left',
  },
  'alert-dialog': {
    Demo: function AlertDialogDemo({ module }) {
      const {
        AlertDialog,
        AlertDialogTrigger,
        AlertDialogContent,
        AlertDialogHeader,
        AlertDialogTitle,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogCancel,
        AlertDialogAction,
      } = module;
      if (!AlertDialog) return null;
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='outline'>Open alert dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone and will remove the resource permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
    wrapperClassName: 'justify-start',
  },
  avatar: {
    getDefaultProps: ({ module }) => {
      const { AvatarImage, AvatarFallback } = module;
      return {
        className: 'h-14 w-14',
        children: (
          <>
            <AvatarImage src='https://avatar.vercel.sh/px' alt='Design system avatar' />
            <AvatarFallback>PX</AvatarFallback>
          </>
        ),
      };
    },
    wrapperClassName: 'p-4',
  },
  badge: {
    defaultProps: { children: 'Badge' },
  },
  button: {
    defaultProps: { children: 'Button' },
  },
  calendar: {
    Demo: function CalendarDemo({ module }) {
      const { Calendar } = module;
      const [date, setDate] = React.useState(() => new Date());
      if (!Calendar) return null;
      return (
        <div className='w-full max-w-sm rounded-lg border p-4'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={setDate}
            className='rounded-md border'
          />
        </div>
      );
    },
  },
  card: {
    Demo: function CardDemo({ module }) {
      const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } = module;
      if (!Card) return null;
      return (
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Project summary</CardTitle>
            <CardDescription>Key activity metrics for this week.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            <p className='text-sm text-muted-foreground'>
              Completed 8 of 10 deliverables and reached 92% compliance across audits.
            </p>
            <p className='text-sm font-medium'>Due next: Vendor Access Review · 14 Aug</p>
          </CardContent>
          <CardFooter className='justify-end'>
            <Button size='sm'>View report</Button>
          </CardFooter>
        </Card>
      );
    },
  },
  checkbox: {
    Demo: function CheckboxDemo({ module }) {
      const { Checkbox } = module;
      if (!Checkbox) return null;
      return (
        <label className='flex items-center gap-2 text-sm text-foreground'>
          <Checkbox defaultChecked id='design-system-checkbox' />
          Accept terms and conditions
        </label>
      );
    },
    wrapperClassName: 'justify-start',
  },
  combobox: {
    Demo: function ComboboxDemo({ module }) {
      const { Combobox } = module;
      const [value, setValue] = React.useState('apple');
      if (!Combobox) return null;
      const options = [
        { label: 'Apple', value: 'apple' },
        { label: 'Orange', value: 'orange' },
        { label: 'Grape', value: 'grape' },
      ];
      return (
        <div className='w-full max-w-xs'>
          <Combobox
            options={options}
            value={value}
            onValueChange={setValue}
            placeholder='Select a fruit'
          />
        </div>
      );
    },
  },
  command: {
    Demo: function CommandDemo({ module }) {
      const {
        Command,
        CommandInput,
        CommandList,
        CommandGroup,
        CommandItem,
        CommandEmpty,
        CommandSeparator,
      } = module;
      const [search, setSearch] = React.useState('');
      if (!Command) return null;
      return (
        <div className='w-full max-w-lg overflow-hidden rounded-lg border'>
          <Command>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder='Search actions...'
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading='Shortcuts'>
                <CommandItem>Open dashboard</CommandItem>
                <CommandItem>Create evidence record</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading='Navigation'>
                <CommandItem>Compliance workspace</CommandItem>
                <CommandItem>Audit trails</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      );
    },
  },
  dialog: {
    Demo: function DialogDemo({ module }) {
      const {
        Dialog,
        DialogTrigger,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
        DialogFooter,
        DialogClose,
      } = module;
      if (!Dialog) return null;
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new task</DialogTitle>
              <DialogDescription>
                Fill in the details and assign owners before publishing the task.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-2'>
              <label className='text-sm font-medium text-foreground'>Task name</label>
              <input
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                defaultValue='Risk assessment review'
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    },
  },
  'dropdown-menu': {
    Demo: function DropdownMenuDemo({ module }) {
      const {
        DropdownMenu,
        DropdownMenuTrigger,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuLabel,
      } = module;
      if (!DropdownMenu) return null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline'>Open menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56'>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  'hover-card': {
    Demo: function HoverCardDemo({ module }) {
      const { HoverCard, HoverCardTrigger, HoverCardContent } = module;
      if (!HoverCard) return null;
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant='link'>Hover to preview</Button>
          </HoverCardTrigger>
          <HoverCardContent className='space-y-2'>
            <p className='text-sm font-medium text-foreground'>Workspace</p>
            <p className='text-sm text-muted-foreground'>All compliance initiatives in a single place.</p>
          </HoverCardContent>
        </HoverCard>
      );
    },
  },
  input: {
    defaultProps: { placeholder: 'Enter value' },
  },
  'navigation-menu': {
    Demo: function NavigationMenuDemo({ module }) {
      const {
        NavigationMenu,
        NavigationMenuList,
        NavigationMenuItem,
        NavigationMenuTrigger,
        NavigationMenuContent,
        NavigationMenuLink,
      } = module;
      if (!NavigationMenu) return null;
      return (
        <NavigationMenu className='w-full justify-center'>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
              <NavigationMenuContent className='grid gap-2 p-4 md:w-[300px]'>
                <NavigationMenuLink className='rounded-md border p-3 text-sm'>
                  Governance engine
                </NavigationMenuLink>
                <NavigationMenuLink className='rounded-md border p-3 text-sm'>
                  Evidence management
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent className='grid gap-2 p-4 md:w-[200px]'>
                <NavigationMenuLink className='rounded-md border p-3 text-sm'>
                  Documentation
                </NavigationMenuLink>
                <NavigationMenuLink className='rounded-md border p-3 text-sm'>
                  Changelog
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
    },
  },
  pagination: {
    Demo: function PaginationDemo({ module }) {
      const {
        Pagination,
        PaginationContent,
        PaginationItem,
        PaginationLink,
        PaginationPrevious,
        PaginationNext,
        PaginationEllipsis,
      } = module;
      if (!Pagination) return null;
      return (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href='#' />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href='#'>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href='#' isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href='#'>5</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href='#' />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
    },
  },
  popover: {
    Demo: function PopoverDemo({ module }) {
      const { Popover, PopoverTrigger, PopoverContent } = module;
      if (!Popover) return null;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline'>Open popover</Button>
          </PopoverTrigger>
          <PopoverContent className='space-y-2'>
            <p className='text-sm font-medium text-foreground'>Popover title</p>
            <p className='text-sm text-muted-foreground'>Useful contextual content fits neatly here.</p>
          </PopoverContent>
        </Popover>
      );
    },
  },
  progress: {
    defaultProps: { value: 60 },
  },
  'radio-group': {
    Demo: function RadioGroupDemo({ module }) {
      const { RadioGroup, RadioGroupItem } = module;
      if (!RadioGroup) return null;
      return (
        <RadioGroup defaultValue='daily' className='flex gap-4'>
          <label className='flex items-center gap-2 text-sm text-foreground'>
            <RadioGroupItem value='daily' /> Daily
          </label>
          <label className='flex items-center gap-2 text-sm text-foreground'>
            <RadioGroupItem value='weekly' /> Weekly
          </label>
        </RadioGroup>
      );
    },
    wrapperClassName: 'justify-start',
  },
  resizable: {
    Demo: function ResizableDemo({ module }) {
      const { ResizablePanelGroup, ResizablePanel, ResizableHandle } = module;
      if (!ResizablePanelGroup) return null;
      return (
        <div className='h-48 w-full max-w-2xl rounded-lg border p-4'>
          <ResizablePanelGroup direction='horizontal' className='h-full rounded-md border'>
            <ResizablePanel defaultSize={50} className='flex items-center justify-center p-4'>
              <span className='text-sm text-muted-foreground'>Panel A</span>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} className='flex items-center justify-center p-4'>
              <span className='text-sm text-muted-foreground'>Panel B</span>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      );
    },
  },
  'scroll-area': {
    Demo: function ScrollAreaDemo({ module }) {
      const { ScrollArea } = module;
      if (!ScrollArea) return null;
      return (
        <ScrollArea className='h-32 w-full max-w-sm rounded-md border'>
          <div className='p-4 text-sm text-muted-foreground'>
            {Array.from({ length: 12 }).map((_, index) => (
              <p key={index} className='mb-2'>
                Item {index + 1}: Keep important documents within easy reach.
              </p>
            ))}
          </div>
        </ScrollArea>
      );
    },
  },
  select: {
    Demo: function SelectDemo({ module }) {
      const {
        Select,
        SelectTrigger,
        SelectContent,
        SelectItem,
        SelectValue,
      } = module;
      const [value, setValue] = React.useState('light');
      if (!Select) return null;
      return (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder='Select theme' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='light'>Light</SelectItem>
            <SelectItem value='dark'>Dark</SelectItem>
            <SelectItem value='system'>System</SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
  sheet: {
    Demo: function SheetDemo({ module }) {
      const {
        Sheet,
        SheetTrigger,
        SheetContent,
        SheetHeader,
        SheetTitle,
        SheetDescription,
        SheetFooter,
        SheetClose,
      } = module;
      if (!Sheet) return null;
      return (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline'>Open sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>Update workspace preferences instantly.</SheetDescription>
            </SheetHeader>
            <div className='grid gap-2 py-4'>
              <label className='text-sm font-medium text-foreground'>Display name</label>
              <input
                className='rounded-md border border-input bg-background px-3 py-2 text-sm'
                defaultValue='Acme Compliance'
              />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant='outline'>Cancel</Button>
              </SheetClose>
              <Button>Save changes</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );
    },
  },
  skeleton: {
    defaultProps: { className: 'h-8 w-32' },
  },
  slider: {
    defaultProps: { defaultValue: [50] },
    wrapperClassName: 'px-6',
  },
  switch: {
    defaultProps: { defaultChecked: true },
  },
  table: {
    Demo: function TableDemo({ module }) {
      const { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } = module;
      if (!Table) return null;
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Evidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Ada Lovelace</TableCell>
              <TableCell>In review</TableCell>
              <TableCell className='text-right'>12 files</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Grace Hopper</TableCell>
              <TableCell>Approved</TableCell>
              <TableCell className='text-right'>9 files</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
    },
    wrapperClassName: 'p-0',
  },
  tabs: {
    Demo: function TabsDemo({ module }) {
      const { Tabs, TabsList, TabsTrigger, TabsContent } = module;
      const [value, setValue] = React.useState('overview');
      if (!Tabs) return null;
      return (
        <Tabs value={value} onValueChange={setValue} className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='activity'>Activity</TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='rounded-md border bg-background p-4 text-sm text-muted-foreground'>
            Stay on top of compliance KPIs across teams.
          </TabsContent>
          <TabsContent value='activity' className='rounded-md border bg-background p-4 text-sm text-muted-foreground'>
            Recent control updates appear here in real time.
          </TabsContent>
        </Tabs>
      );
    },
  },
  textarea: {
    defaultProps: { placeholder: 'Add a note...' },
  },
  toast: {
    Demo: function ToastDemo({ module }) {
      const { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose, ToastViewport } = module;
      const [open, setOpen] = React.useState(false);
      if (!ToastProvider) return null;
      return (
        <ToastProvider swipeDirection='right'>
          <div className='flex items-center gap-3'>
            <Button onClick={() => setOpen(true)}>Show toast</Button>
            <span className='text-sm text-muted-foreground'>Notifications preview</span>
          </div>
          <Toast open={open} onOpenChange={setOpen} className='mt-4'>
            <div className='grid gap-1'>
              <ToastTitle>Evidence uploaded</ToastTitle>
              <ToastDescription>Control framework updated successfully.</ToastDescription>
            </div>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
    },
  },
  toaster: {
    note: 'The Toaster component listens to the toast store. Trigger toasts from the useToast hook to preview it in context.',
    disableDefault: true,
  },
  toggle: {
    defaultProps: { children: 'Toggle', defaultPressed: true },
  },
  tooltip: {
    Demo: function TooltipDemo({ module }) {
      const { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } = module;
      if (!TooltipProvider) return null;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='outline'>Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Helpful contextual tip.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  AppSidebar: {
    note: 'Layout component. Preview it within the dashboard shell for best results.',
    disableDefault: true,
  },
  SiteHeader: {
    Demo: function SiteHeaderDemo({ module }) {
      const SiteHeader = module.default;
      if (!SiteHeader) return null;
      return (
        <div className='w-full rounded-lg border bg-background'>
          <SiteHeader onToggleSidebar={() => {}} />
        </div>
      );
    },
  },
};

export default componentDemoConfig;
