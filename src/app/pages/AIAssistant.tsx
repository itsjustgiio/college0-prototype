import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Send, AlertTriangle, Database, Sparkles, Loader2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { useAuth } from "../auth/AuthProvider";
import { handleAIQuery } from "../services/aiService";

interface Message {
  id: number;
  type: "user" | "assistant";
  content: string;
  source?: "database" | "llm";
  warning?: boolean;
}

function describeAIError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("429 Too Many Requests") || message.includes("Quota exceeded")) {
    return "Gemini is reachable, but this API key or project currently has no quota available for the configured model.";
  }

  if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
    return "Gemini rejected the configured API key. Check VITE_GEMINI_API_KEY in your local environment.";
  }

  if (message.includes("reported as leaked")) {
    return "Gemini blocked this API key because it was reported as leaked. Create a new key and update the local environment file.";
  }

  return "Something went wrong reaching the AI fallback. Please try again.";
}

export function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "assistant",
      content: "Hello. I can help with courses, registration, deadlines, and program requirements.",
      source: "database",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sampleQuestions = [
    "What are the graduation requirements?",
    "Which courses should I take next?",
    "When is the registration deadline?",
    "What is my current GPA?",
    "Where can I eat near CCNY?",
    "Where can I study on campus?",
    "Where can I get tutoring?",
    "Where do I get my student ID?",
    "Where can I hang out between classes?",
  ];

  const handleSend = async () => {
    if (!input.trim() || loading || !user) return;

    const query = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: Date.now(), type: "user", content: query }]);
    setLoading(true);

    try {
      const result = await handleAIQuery(query, user.role, user.email, user.name);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "assistant",
          content: result.answer,
          source: result.source,
          warning: result.warning,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "assistant",
          content: describeAIError(error),
          source: "llm",
          warning: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/student" className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <h1 className="text-3xl text-slate-950">AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-600">Ask a question and see whether the answer comes from the database or a fallback model.</p>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardBody>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-blue-700" />
            <div>
              <h3 className="text-base text-blue-950">Answer priority</h3>
              <p className="mt-1 text-sm leading-6 text-blue-900">
                The assistant checks structured college information first. If no match is found, it falls back to a general response and marks it clearly.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.75fr]">
        <Card className="flex min-h-[620px] flex-col">
          <CardHeader>
            <h2 className="text-xl text-slate-950">Conversation</h2>
          </CardHeader>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-6 py-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-3xl px-4 py-3 ${
                  message.type === "user" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-900"
                }`}>
                  <p className="text-sm leading-6">{message.content}</p>
                  {message.type === "assistant" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {message.source === "database" ? (
                        <>
                          <Database className="h-3.5 w-3.5 text-emerald-700" />
                          <Badge variant="success">Database</Badge>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                          <Badge variant="warning">Fallback model</Badge>
                          {message.warning && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Verify before acting
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask a question..."
                disabled={loading}
                className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
              <Button variant="primary" onClick={handleSend} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg text-slate-950">Suggested Questions</h2>
            </CardHeader>
            <CardBody className="space-y-2">
              {sampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {question}
                </button>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg text-slate-950">Sources</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-700" />
                  <Badge variant="success">Database</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">Structured college information with higher reliability.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-700" />
                  <Badge variant="warning">Fallback model</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-700">General guidance only. Confirm policy or requirement details before acting.</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
