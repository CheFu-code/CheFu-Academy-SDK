namespace CheFu.Academy;

public sealed class CheFuAcademyException : Exception
{
    public CheFuAcademyException(string message, int? statusCode = null)
        : base(message)
    {
        StatusCode = statusCode;
    }

    public int? StatusCode { get; }
}
