import { ChildProcess } from 'child_process';

export interface ManagedProcess {
    process: ChildProcess;
    stdout: string[];
    stderr: string[];
}

export const background_processes = new Map<number, ManagedProcess>();
