import type { DSAQuestion } from '@/types/types';
import { generateId, todayISO, calculateNextRevision } from '@/utils/helpers';

export const DEMO_QUESTIONS: Omit<DSAQuestion, 'id' | 'createdAt' | 'xpEarned'>[] = [
    {
        name: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum/',
        platform: 'LeetCode',
        difficulty: 'Easy',
        tags: ['Array', 'Hashing'],
        approachSummary: 'Use a hashmap to store complements while iterating',
        optimalApproach: 'O(n) single pass with hashmap lookup',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        confidence: 4,
        mistakeNotes: 'Initially tried brute force O(n²), forgot hashmap approach',
        lastRevised: todayISO(),
        nextRevision: calculateNextRevision(4),
        revisionHistory: [{ date: todayISO(), confidence: 4 }],
    },
    {
        name: 'Longest Substring Without Repeating Characters',
        url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
        platform: 'LeetCode',
        difficulty: 'Medium',
        tags: ['String', 'Sliding Window', 'Hashing'],
        approachSummary: 'Sliding window with a set to track characters',
        optimalApproach: 'Two-pointer sliding window approach',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(min(n,m))',
        confidence: 3,
        mistakeNotes: 'Off-by-one error in window size calculation. Forgot to update left pointer correctly.',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 2);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return d.toISOString().split('T')[0];
        })(),
        revisionHistory: [],
    },
    {
        name: 'Merge Intervals',
        url: 'https://leetcode.com/problems/merge-intervals/',
        platform: 'LeetCode',
        difficulty: 'Medium',
        tags: ['Array', 'Sorting'],
        approachSummary: 'Sort by start time, then merge overlapping intervals',
        optimalApproach: 'Sort + linear scan',
        timeComplexity: 'O(n log n)',
        spaceComplexity: 'O(n)',
        confidence: 2,
        mistakeNotes: 'Edge case: single interval. Also missed when intervals are adjacent (end == next start)',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 4);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return d.toISOString().split('T')[0];
        })(),
        revisionHistory: [],
    },
    {
        name: 'Climbing Stairs',
        url: 'https://leetcode.com/problems/climbing-stairs/',
        platform: 'LeetCode',
        difficulty: 'Easy',
        tags: ['Dynamic Programming', 'Recursion'],
        approachSummary: 'DP with bottom-up approach, similar to Fibonacci',
        optimalApproach: 'O(n) DP or O(1) space optimization',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        confidence: 5,
        mistakeNotes: 'Initially wrote recursive solution without memoization — TLE on large inputs',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 3);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: calculateNextRevision(5),
        revisionHistory: [],
    },
    {
        name: 'Binary Search',
        url: 'https://leetcode.com/problems/binary-search/',
        platform: 'LeetCode',
        difficulty: 'Easy',
        tags: ['Binary Search', 'Array'],
        approachSummary: 'Standard binary search with left, right, mid pointers',
        optimalApproach: 'Iterative binary search',
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
        confidence: 4,
        mistakeNotes: 'Off-by-one: should use mid = left + (right - left) / 2 to avoid overflow',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: calculateNextRevision(4),
        revisionHistory: [],
    },
    {
        name: 'Number of Islands',
        url: 'https://leetcode.com/problems/number-of-islands/',
        platform: 'LeetCode',
        difficulty: 'Medium',
        tags: ['Graph', 'Array', 'Backtracking'],
        approachSummary: 'BFS/DFS to explore connected land cells and count components',
        optimalApproach: 'DFS with in-place grid marking',
        timeComplexity: 'O(m*n)',
        spaceComplexity: 'O(m*n)',
        confidence: 3,
        mistakeNotes: 'Forgot to handle visited cells — kept revisiting. Also missed boundary checks.',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 6);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return d.toISOString().split('T')[0];
        })(),
        revisionHistory: [],
    },
    {
        name: 'Longest Common Subsequence',
        url: 'https://leetcode.com/problems/longest-common-subsequence/',
        platform: 'LeetCode',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'String'],
        approachSummary: '2D DP table where dp[i][j] = LCS of first i and j chars',
        optimalApproach: '2D DP bottom-up',
        timeComplexity: 'O(m*n)',
        spaceComplexity: 'O(m*n)',
        confidence: 1,
        mistakeNotes:
            'Confused with Longest Common Substring. DP state transition incorrect — did not handle the "not matching" case properly.',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 8);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 6);
            return d.toISOString().split('T')[0];
        })(),
        revisionHistory: [],
    },
    {
        name: 'Kth Largest Element in Array',
        url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
        platform: 'LeetCode',
        difficulty: 'Medium',
        tags: ['Array', 'Heap', 'Sorting'],
        approachSummary: 'Min-heap of size k, or Quickselect algorithm',
        optimalApproach: 'Quickselect O(n) average',
        timeComplexity: 'O(n log k)',
        spaceComplexity: 'O(k)',
        confidence: 2,
        mistakeNotes: 'Initially sorted whole array — missed heap optimization. Quickselect pivot selection tricky.',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 5);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 2);
            return d.toISOString().split('T')[0];
        })(),
        revisionHistory: [],
    },
    {
        name: 'Valid Parentheses',
        url: 'https://leetcode.com/problems/valid-parentheses/',
        platform: 'LeetCode',
        difficulty: 'Easy',
        tags: ['Stack', 'String'],
        approachSummary: 'Use a stack — push open brackets, pop and match for closing',
        optimalApproach: 'Stack-based O(n) solution',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        confidence: 5,
        mistakeNotes: 'Edge case: empty string should return true. Stack not empty at end = false.',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 12);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: calculateNextRevision(5),
        revisionHistory: [],
    },
    {
        name: 'Coin Change',
        url: 'https://leetcode.com/problems/coin-change/',
        platform: 'LeetCode',
        difficulty: 'Medium',
        tags: ['Dynamic Programming', 'Array'],
        approachSummary: 'Bottom-up DP: dp[i] = min coins needed for amount i',
        optimalApproach: 'Bottom-up DP with O(amount * coins) time',
        timeComplexity: 'O(amount * n)',
        spaceComplexity: 'O(amount)',
        confidence: 2,
        mistakeNotes: 'DP State Errors: initialized dp[0] wrongly. Greedy approach fails for certain coin sets.',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 4);
            return d.toISOString().split('T')[0];
        })(),
        revisionHistory: [],
    },
    {
        name: 'Course Schedule',
        url: 'https://leetcode.com/problems/course-schedule/',
        platform: 'LeetCode',
        difficulty: 'Medium',
        tags: ['Graph', 'Backtracking'],
        approachSummary: 'Topological sort / cycle detection with DFS',
        optimalApproach: 'BFS Kahn\'s algorithm for topological order',
        timeComplexity: 'O(V + E)',
        spaceComplexity: 'O(V + E)',
        confidence: 1,
        mistakeNotes: 'Graph traversal: Missed marking nodes as visited/in-stack. Cycle detection logic was off.',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 10);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 8);
            return d.toISOString().split('T')[0];
        })(),
        revisionHistory: [],
    },
    {
        name: 'Maximum Subarray',
        url: 'https://leetcode.com/problems/maximum-subarray/',
        platform: 'LeetCode',
        difficulty: 'Medium',
        tags: ['Array', 'Dynamic Programming', 'Greedy'],
        approachSummary: "Kadane's Algorithm — track current sum and max sum",
        optimalApproach: "Kadane's O(n)",
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        confidence: 4,
        mistakeNotes: 'Edge case: all negative numbers — max should be least negative, not 0',
        lastRevised: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 2);
            return d.toISOString().split('T')[0];
        })(),
        nextRevision: calculateNextRevision(4),
        revisionHistory: [],
    },
];

export function seedDemoData(): void {
    const questions: DSAQuestion[] = DEMO_QUESTIONS.map((q) => ({
        ...q,
        id: generateId(),
        createdAt: new Date().toISOString(),
        xpEarned: 0,
    }));

    localStorage.setItem('dsa_questions', JSON.stringify(questions));
    localStorage.setItem(
        'dsa_stats',
        JSON.stringify({
            currentStreak: 3,
            longestStreak: 7,
            lastRevisionDate: todayISO(),
            totalXP: 245,
            level: 3,
            achievements: [],
        })
    );
}

