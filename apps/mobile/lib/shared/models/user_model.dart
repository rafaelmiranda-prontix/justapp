class UserModel {
  final String id;
  final String email;
  final String name;
  final String? phone;
  final String? avatarUrl;
  final String role;
  final DateTime createdAt;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    this.phone,
    this.avatarUrl,
    required this.role,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      phone: json['phone'],
      avatarUrl: json['avatarUrl'],
      role: json['role'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  bool get isClient => role == 'CLIENT';
  bool get isLawyer => role == 'LAWYER';
  bool get isAdmin => role == 'ADMIN';
}
