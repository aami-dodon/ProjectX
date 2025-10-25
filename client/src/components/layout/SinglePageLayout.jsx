import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { buttonVariants } from '../ui/button';
import { cn } from '../../lib/utils';

export const SinglePageLayout = ({ children, className }) => {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-5xl flex-col gap-xl py-[calc(var(--space-xl)+var(--space-lg))]',
        className,
      )}
    >
      {children}
    </div>
  );
};

export const PageHeader = ({ title, eyebrow, description, descriptionClassName }) => {
  return (
    <header className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex flex-col gap-xs">
          {eyebrow ? <span className="eyebrow text-primary">{eyebrow}</span> : null}
          <h1 className="h1">{title}</h1>
        </div>
        <Link to="/" className={cn(buttonVariants({ variant: 'ghost' }), 'inline-flex items-center gap-xs')}>
          <Home className="h-4 w-4" />
          <span>Back to home</span>
        </Link>
      </div>
      {description ? (
        <p className={descriptionClassName ?? 'body-sm text-muted'}>{description}</p>
      ) : null}
    </header>
  );
};

export default SinglePageLayout;
