import { ref } from "vue";
import { onUnmounted } from "vue";

export function useApi(baseUrl: string, options: { token?: string } = {}) {
  const data = ref<any>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  let controller: AbortController | null = null;

  onUnmounted(() => controller?.abort());

  function buildHeaders(extra: Record<string, string> = {}) {
    return {
      Accept: "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...extra,
    };
  }

  async function handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = `HTTP error: ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.message) errorMessage = errData.message;
      } catch (e) {}
      throw new Error(errorMessage);
    }
    return await response.json();
  }

  async function getAll(params?: Record<string, any>) {
    controller?.abort();
    controller = new AbortController();
    loading.value = true;
    error.value = null;
    try {
      const url = params
        ? `${baseUrl}?${new URLSearchParams(params)}`
        : baseUrl;
      const response = await fetch(url, {
        headers: buildHeaders(),
        signal: controller.signal,
      });
      data.value = await handleResponse(response);
    } catch (err: any) {
      if (err.name !== "AbortError") error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function getOne(id: string | number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${baseUrl}/${id}`, {
        headers: buildHeaders(),
      });
      data.value = await handleResponse(response);
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function post(body: any, customEndpoint: string = "") {
    loading.value = true;
    error.value = null;
    try {
      const url = customEndpoint ? `${baseUrl}/${customEndpoint}` : baseUrl;
      const response = await fetch(url, {
        method: "POST",
        headers: buildHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      data.value = await handleResponse(response);
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function update(id: string | number, body: any) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${baseUrl}/${id}`, {
        method: "PUT",
        headers: buildHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      data.value = await handleResponse(response);
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function remove(id: string | number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${baseUrl}/${id}`, {
        method: "DELETE",
        headers: buildHeaders(),
      });
      data.value = await handleResponse(response);
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  return { data, error, loading, getAll, getOne, post, update, remove };
}
